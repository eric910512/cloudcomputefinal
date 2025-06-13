document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const premium = body.dataset.premium === 'true';
  let swipeLeft = parseInt(body.dataset.remainingSwipes);
  const nextResetTime = parseInt(body.dataset.nextReset);

  let current = 0;
  let data = [];
  let maxFreeCards = 10;
  let favorites = [];  // ⭐ 收藏清單在這裡！

  fetch('/api/restaurants')
    .then(res => res.json())
    .then(json => {
      data = json;
      showCard();
      updateSwipeInfo();
      updateFavorites();
    });

  function updateSwipeInfo() {
    if (!premium && swipeLeft !== null) {
      const swipeInfo = document.getElementById('swipe-info');
      const progress = document.getElementById('progress');

      const now = Date.now() / 1000;
      const remainingTime = nextResetTime - now;

      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      const seconds = Math.floor(remainingTime % 60);

      swipeInfo.innerHTML = `
        剩餘次數：${swipeLeft} 次<br>
        重置倒數：${hours} 小時 ${minutes} 分 ${seconds} 秒
      `;

      const widthPercent = (swipeLeft / maxFreeCards) * 100;
      progress.style.width = widthPercent + '%';
    }
  }

function updateFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    let html = '';

    if (premium) {
        // ⭐ 付費版有收藏數量顯示
        html += `<p>收藏：${favorites.length} / ∞</p>`;
        html += "<ul>" +
          favorites.map(item => `<li><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item)}" target="_blank">${item}</a></li>`).join('') +
          "</ul>";

        if (favorites.length === 0) {
            html += "<p>目前還沒有收藏喔～</p>";
        }
    } else {
        // ⭐ 免費版直接提示升級，不要列收藏
        html += `
          <p>升級成付費會員即可解鎖收藏功能！</p>
          <a href="/upgrade" style="color: #ff416c; font-size: 18px;">✨ 馬上升級 ➔</a>
        `;
    }

    favoritesList.innerHTML = html;
}




  // 🔥 收合功能塞在這裡，不要開新的 DOMContentLoaded
  const toggleButton = document.getElementById('toggle-favorites');
  const favoritesList = document.getElementById('favorites-list');
  let isCollapsed = false;

  toggleButton.addEventListener('click', () => {
      if (isCollapsed) {
          favoritesList.style.display = 'block';
          toggleButton.textContent = '➖'; // 展開
      } else {
          favoritesList.style.display = 'none';
          toggleButton.textContent = '➕'; // 收合
      }
      isCollapsed = !isCollapsed;
  });

  setInterval(updateSwipeInfo, 1000);

  function showCard() {
    const card = document.getElementById('card');
    if (!premium && swipeLeft <= 0) {
      card.innerHTML = `
        <h2>免費次數已用完！</h2>
        <p>升級成付費會員，解鎖無限次滑美食！</p>
        <a href="/upgrade" style="color: #ff416c; font-size: 18px;">✨ 馬上升級 ➔</a>
      `;
      return;
    }

    if (current >= data.length) {
      card.innerHTML = "<h2>你已經選完所有美食！</h2>";
      return;
    }

    const r = data[current];
    card.innerHTML = `
      <img src="${r.image}" alt="${r.name}" style="max-width: 300px; border-radius: 10px;" />
      <h3>${r.name}</h3>
      <p>${r.tag}</p>
      <p>🗺️ <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}" target="_blank">${r.address}</a></p>
      ${generateHoursTable(r.hours)}
    `;
  }

window.like = function () {
    if (!premium && swipeLeft <= 0) {
        alert("免費次數已用完！請等候重置或升級付費版！");
        return;
    }

    if (premium) {
        // 付費版才能收藏
        favorites.push(data[current].name);
        updateFavorites();
    }

    current++;
    if (!premium) swipeLeft--;
    showCard();
};


  window.dislike = function () {
    if (!premium && swipeLeft <= 0) {
      alert("免費次數已用完！請等候重置或升級付費版！");
      return;
    }
    console.log("❌ 略過：" + data[current].name);
    current++;
    if (!premium) swipeLeft--;
    showCard();
    // ❌ 略過不需要更新收藏
  };
});

// ⭐ 注意：這個放外面，因為 generateHoursTable 是通用工具函式
function generateHoursTable(hours) {
  const daysOfWeek = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
  let table = '<div class="hours-table">';
  for (const day of daysOfWeek) {
    if (hours[day]) {
      table += `<div><strong>${day}</strong> ${hours[day]}</div>`;
    }
  }
  table += '</div>';
  return table;
}
