from flask import Flask, render_template, request, redirect, session, jsonify
from datetime import datetime, timedelta
import json, os

app = Flask(__name__)
app.secret_key = 'your-secret-key'

USER_FILE = 'data/users.json'
KEY_FILE = 'data/keys.json'

def load_users():
    if os.path.exists(USER_FILE):
        with open(USER_FILE, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def save_users(users):
    with open(USER_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def load_keys():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

@app.route('/')
def index():
    if 'user' not in session:
        return redirect('/login')
    
    users = load_users()
    user_data = next((u for u in users if u['account'] == session['user']), None)
    is_premium = user_data.get('is_premium', False)

    return render_template('index.html', user=session['user'], premium=is_premium)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        account = request.form['account']
        password = request.form['password']
        users = load_users()
        for u in users:
            if u['account'] == account and u['password'] == password:
                if 'is_premium' not in u:
                    u['is_premium'] = False
                    save_users(users)
                session['user'] = account
                return redirect('/')
        return '帳號或密碼錯誤'
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        account = request.form['account']
        password = request.form['password']
        users = load_users()
        if any(u['account'] == account for u in users):
            return '帳號已存在'
        users.append({'account': account, 'password': password, 'is_premium': False})
        save_users(users)
        return redirect('/login')
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

@app.route('/upgrade', methods=['GET', 'POST'])
def upgrade():
    if 'user' not in session:
        return redirect('/login')

    if request.method == 'POST':
        input_key = request.form['key']
        keys = load_keys()
        if input_key in keys:
            users = load_users()
            for u in users:
                if u['account'] == session['user']:
                    u['is_premium'] = True
                    break
            save_users(users)
            keys.remove(input_key)
            with open(KEY_FILE, 'w', encoding='utf-8') as f:
                json.dump(keys, f, indent=2)
            return '升級成功！您現在是付費用戶。<a href="/">回首頁</a>'
        else:
            return '金鑰錯誤或已失效'
    
    return render_template('upgrade.html')

@app.route('/api/restaurants')
def get_restaurants():
    with open('data/restaurants.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.before_request
def check_swipe_limit():
    if 'user' in session:
        users = load_users()
        user_data = next((u for u in users if u['account'] == session['user']), None)

        if user_data.get('is_premium'):
            session['remaining_swipes'] = None
            session['next_reset'] = None
        else:
            if 'remaining_swipes' not in session:
                session['remaining_swipes'] = 10
                session['next_reset'] = (datetime.now() + timedelta(hours=12)).timestamp()
            else:
                if datetime.now().timestamp() >= session['next_reset']:
                    session['remaining_swipes'] = 10
                    session['next_reset'] = (datetime.now() + timedelta(hours=12)).timestamp()


if __name__ == '__main__':
    app.run(debug=True)
