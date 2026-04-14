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

// get request kwa the external Api
async function fetchAnime(question) {
  try {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = '<div class="loading">Searching for anime...</div>';
    
    const encodedQuestion = encodeURIComponent(question);//encodes special characters so that they can be safely included in the URL query string
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodedQuestion}&limit=20`);//here we have included encoded question na it has been limited to 20 results
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const data = await res.json();//response inakuwa in JSON format na we wait for the parsing to completer then we check if its valid and has data
    if (!data || !data.data || data.data.length === 0) {
      displayMessage(`howdy! no results "${question}". mind trying a different?`);
      return;
    }
    
    currentAnimeList = data.data;
    displayAnime(currentAnimeList);
  } catch (error) {
    console.error("search error:", error); //logs error to console of the browser
    displayMessage(`well ill be damned, seems i cant find "${question}" with my vast knowledge. Please try again later my fellow anime enthusiast.`);
  }
}

function displayAnime(animeList, fromRecentlyViewed = false)
//lets get the anime list and display it in the results container and clear all the html content
{
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";
  
  if (!animeList || animeList.length === 0) {
    displayMessage("No anime to display");
    return;
  }
  
  // Save current list for back navigation
  previousViewList = animeList;
  // <img src="${anime.images?.jpg?.image_url || 'https://via.placeholder.com/225x319?text=No+Image'}" alt="${anime.title}"></img>
  animeList.forEach((anime) => {
    const isFav = getFavourites().some(a => a.mal_id === anime.mal_id); //checks if any fav matches the current anime's ID
    const card = document.createElement("div");
    card.classList.add("anime-card");//added class to the div
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
//after clicking on the anime card this are the details that will be shown below
function showAnimeDetails(anime) {
  const resultsContainer = document.getElementById("results");
  const isFav = getFavourites().some(a => a.mal_id === anime.mal_id);
  
  // synopsis for detail view ni shorter
  const shortSynopsis = anime.synopsis ? anime.synopsis.slice(0, 150) + "..." : "No synopsis available.";
  
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
            <div class="stat"> ${anime.score || 'N/A'}</div>
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
  
  window.currentDetailAnime = anime; //stores anime globally for use by other functions like toggleFavouriteFromDetail
}

// now lets add a functoin to that go back button
function goBackToResults() {
  if (previousViewList && previousViewList.length > 0) {
    displayAnime(previousViewList);
  } else {
    fetchHomeAnime();
  }
}
// malID is a parameter that uniquely identifies anime in the MyAnimeList database scrapped into the jikan api
function toggleFavouriteFromDetail(malId) {
  if (window.currentDetailAnime && window.currentDetailAnime.mal_id === malId) {
    toggleFavourite(window.currentDetailAnime);
    showAnimeDetails(window.currentDetailAnime);
  }
}


// this adds,stores and retrieves using setItem and getItem from the local storage of the browser
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
    displayMessage("well hello there my fellow anime enthusiast,Click on any anime to view details");
  } else {
    displayAnime(recent, true);
  }
}

// this adds,stores and retrieves using setItem and getItem from the local storage of the browser for favourites
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

function getFavourites() {
  return JSON.parse(localStorage.getItem("favourites")) || [];
}
function loadFavourites() {
  const favs = getFavourites();
  if (favs.length === 0) {
    displayMessage("Add some anime to your favorites!");
  } else {
    displayAnime(favs);
  }
}

// Event Listeners after getting them by id
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
    
    if (!res.ok) throw new Error(`error: ${res.status}`);
    
    const data = await res.json();
    
    if (!data.data || data.data.length === 0) {
      displayMessage("No anime found for this genre");
      return;
    }
    
    currentAnimeList = data.data;
    displayAnime(currentAnimeList.slice(0, 8));
  } catch (error) {
    displayMessage("Gomen nasai(sorry), please try again.");
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
    
    if (!res.ok) throw new Error(`error: ${res.status}`);
    
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

// Initialize with home anime after page load getting top rated anime
fetchHomeAnime();


