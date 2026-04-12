const input = document.getElementById("searchinput");
const button = document.getElementById("searchbtn");
const genres = document.getElementById("genres");
const favourites = document.getElementById("favourite");
const homebutton = document.getElementById("homebutton");
const viewed = document.getElementById("recentlyviewed");

// Track current view to refresh correctly
let currentAnimeList = [];
let previousViewList = [];

button.addEventListener("click", () => {
  const question = input.value.trim();
  
  if (question === "") {
    displayMessage("Please enter an anime name");
    return;
  }
  input.value = "";
  fetchAnime(question);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const question = input.value.trim();
    
    if (question === "") {
      displayMessage("Please enter an anime name");
      return;
    }
    input.value = "";
    fetchAnime(question);
  }
});

function displayMessage(message) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = `<div class="message">${message}</div>`;
}

// http get request kwa the external Api
async function fetchAnime(question) {
  try {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = '<div class="loading">Searching for anime...</div>';
    
    const encodedQuestion = encodeURIComponent(question);
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodedQuestion}&limit=20`);
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const data = await res.json();
    if (!data || !data.data || data.data.length === 0) {
      displayMessage(`No results found for "${question}". Try a different anime name.`);
      return;
    }
    
    currentAnimeList = data.data;
    displayAnime(currentAnimeList);
  } catch (error) {
    console.error("search error:", error);
    displayMessage(`error searching for "${question}". Please try again later.`);
  }
}

function displayAnime(animeList, fromRecentlyViewed = false) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";
  
  if (!animeList || animeList.length === 0) {
    displayMessage("No anime to display");
    return;
  }
  
  // Save current list for back navigation
  previousViewList = animeList;
  
  animeList.forEach((anime) => {
    const isFav = getFavourites().some(a => a.mal_id === anime.mal_id);
    const card = document.createElement("div");
    card.classList.add("anime-card");
    card.innerHTML = `
      <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/225x319?text=No+Image'}" alt="${anime.title}">
      <h3>${anime.title}</h3>
      <p>${anime.synopsis ? anime.synopsis.slice(0, 60) + "..." : "No description"}</p>
      <span> ${anime.episodes || "Unknown"} eps</span>
      <i class="fa-heart fav-icon ${isFav ? "fa-solid active" : "fa-regular"}"></i>
    `;
    
    // Make entire card clickable to view details
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("fav-icon")) {
        return;
      }
      addToRecentlyViewed(anime);
      showAnimeDetails(anime);
    });
    
    const heart = card.querySelector(".fav-icon");
    heart.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavourite(anime);
      if (fromRecentlyViewed) {
        loadRecentlyViewed();
      } else {
        displayAnime(animeList);
      }
    });
    resultsContainer.appendChild(card);
  });
}

function showAnimeDetails(anime) {
  const resultsContainer = document.getElementById("results");
  const isFav = getFavourites().some(a => a.mal_id === anime.mal_id);
  
  // synopsis for detail view ni shorter
  const shortSynopsis = anime.synopsis ? anime.synopsis.slice(0, 15) + "..." : "No synopsis available.";
  
  resultsContainer.innerHTML = `
    <div class="anime-detail">
      <button class="back-button" onclick="window.goBackToResults()"> Back to Results</button>
      <div class="detail-content">
        <div class="detail-left">
          <img src="${anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url}" alt="${anime.title}">
          <button class="favourite-detail-btn ${isFav ? 'active' : ''}" onclick="window.toggleFavouriteFromDetail(${anime.mal_id})">
            <i class="fa-heart ${isFav ? 'fa-solid' : 'fa-regular'}"></i>
            ${isFav ? ' Remove from Favourites' : ' Add to Favourites'}
          </button>
        </div>
        <div class="detail-right">
          <h1>${anime.title}</h1>
          ${anime.title_english ? `<h3>${anime.title_english}</h3>` : ''}
          
          <div class="detail-stats">
            <div class="stat"> ${anime.score || 'SPARROW'}</div>
            <div class="stat"> ${anime.episodes || 'Unknown'}</div>
            <div class="stat"> ${anime.year || 'N/A'}</div>
            <div class="stat"> ${anime.status || 'Unknown'}</div>
          </div>
          
          <div class="detail-genres">
            <strong>Genres:</strong> ${anime.genres?.map(g => g.name).join(', ') || 'N/A'}
          </div>
          
          <div class="detail-synopsis">
            <strong>Synopsis:</strong>
            <p>${shortSynopsis}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  window.currentDetailAnime = anime;
}

function goBackToResults() {
  if (previousViewList && previousViewList.length > 0) {
    displayAnime(previousViewList);
  } else {
    fetchHomeAnime();
  }
}

function toggleFavouriteFromDetail(malId) {
  if (window.currentDetailAnime && window.currentDetailAnime.mal_id === malId) {
    toggleFavourite(window.currentDetailAnime);
    showAnimeDetails(window.currentDetailAnime);
  }
}

function addToRecentlyViewed(anime) {
  let recent = getRecentlyViewed();
  recent = recent.filter(a => a.mal_id !== anime.mal_id);
  recent.unshift(anime);//simulated this adds at the begining simulates both update and patch
  if (recent.length > 10) {
    recent = recent.slice(0, 10);
  }
  localStorage.setItem("recentlyViewed", JSON.stringify(recent));
}

function getRecentlyViewed() {
  return JSON.parse(localStorage.getItem("recentlyViewed")) || [];
}

function loadRecentlyViewed() {
  const recent = getRecentlyViewed();
  if (recent.length === 0) {
    displayMessage("Click on any anime to view details!");
  } else {
    displayAnime(recent, true);
  }
}

function getFavourites() {
  return JSON.parse(localStorage.getItem("favourites")) || [];
}

function toggleFavourite(anime) {
  let favs = getFavourites();
  const exists = favs.some(a => a.mal_id === anime.mal_id);
  
  if (exists) {
    favs = favs.filter(a => a.mal_id !== anime.mal_id);//simulates delete
  } else {
    favs.push(anime);//simulates the post operation by pushing na creating data
  }
  localStorage.setItem("favourites", JSON.stringify(favs));
}

function loadFavourites() {
  const favs = getFavourites();
  if (favs.length === 0) {
    displayMessage("Add some anime to your favorites!");
  } else {
    displayAnime(favs);
  }
}

// Event Listeners
favourites.addEventListener("click", () => {
  loadFavourites();
});

viewed.addEventListener("click", () => {
  loadRecentlyViewed();
});

genres.addEventListener("change", () => {
  const genress = genres.value;
  fetchGenre(genress);
});

// get request from the api for genre based seachr
async function fetchGenre(genress) {
  try {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = '<div class="loading">Loading genre...</div>';
    
    const res = await fetch(`https://api.jikan.moe/v4/anime?genres=${genress}&limit=8`);
    
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    
    const data = await res.json();
    
    if (!data.data || data.data.length === 0) {
      displayMessage("No anime found for this genre");
      return;
    }
    
    currentAnimeList = data.data;
    displayAnime(currentAnimeList.slice(0, 8));
  } catch (error) {
    displayMessage("Error loading genre. Please try again.");
  }
}

homebutton.addEventListener("click", () => {
  fetchHomeAnime();
});

// get request for top-rated anime currently
async function fetchHomeAnime() {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = '<div class="loading">LOADING SPARROW ANIME...</div>';
  try {
    const res = await fetch(`https://api.jikan.moe/v4/top/anime`);
    
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    
    const data = await res.json();
    
    if (!data.data || data.data.length === 0) {
      displayMessage("No home anime available");
      return;
    }
    
    currentAnimeList = data.data;
    displayAnime(currentAnimeList.slice(0, 12));
  } catch (error) {
    console.error("Home fetch error:", error);
    displayMessage("Please refresh since failed to fetch.");
  }
}

// Make functions available globally for onclick handlers
window.goBackToResults = goBackToResults;
window.toggleFavouriteFromDetail = toggleFavouriteFromDetail;

// Initialize with home anime
fetchHomeAnime();


