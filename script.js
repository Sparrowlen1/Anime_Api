const input = document.getElementById("searchinput");
const button = document.getElementById("searchbtn");
const genres = document.getElementById("genres");
const favourite = document.getElementById("favourite");
const homebutton = document.getElementById("homebutton");
const viewed = document.getElementById("recentlyviewed");


button.addEventListener("click", () => {
  const question = input.value;
  input.value = ""; //this will clear the input field 
  fetchAnime(question);
});

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const question = input.value;
    input.value = "";
    fetchAnime(question);
  }
});
// now lets fetch from the jikan api
async function fetchAnime(question) {
  const res = await fetch(`https://api.jikan.moe/v4/anime?q=${question}`);
  const data = await res.json();

  displayAnime(data.data);
}

// now lets display the anime on the page
function displayAnime(animeList) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";
  animeList.forEach((anime) => {
    const card = document.createElement("div");
    card.classList.add("anime-card");
    card.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
            <h3>${anime.title}</h3>
            <p>${anime.synopsis ? anime.synopsis.slice(0, 20) : "No description"}...</p>
      <span>Episodes: ${anime.episodes || "Unknown"}</span>
        `;
    resultsContainer.appendChild(card);
  });
}


// now we in the genre part

genres.addEventListener("change", ()=>{
    const genress=genres.value;
    fetchGenre(genress)
})
async function fetchGenre(genress){
    const res = await fetch(`https://api.jikan.moe/v4/anime?genres=${genress}`);
    const data = await res.json();
    displayAnime(data.data.slice(0,8));
}


homebutton.addEventListener("click",()=>{
    fetchHomeAnime();
})

async function fetchHomeAnime(){
    const res = await fetch(`https://api.jikan.moe/v4/top/anime`);
    const data = await res.json();
    displayAnime(data.data.slice(0,12));
}

// // adding event listener for the favourite and recently viewed buttons
// favourite.addEventListener("click",()=>{
//     fetchFavouriteAnime();
// }
// )
// async function fetchFavouriteAnime(){
//     const res = await fetch(`https://api.jikan.moe/v4/top/anime?filter=favorite`);
//     const data = await res.json();
//     displayAnime(data.data.slice(0,12));
// }

// viewed.addEventListener("click",()=>{
//     fetchViewedAnime();
// })
// async function fetchViewedAnime(){
//     const res = await fetch(`https://api.jikan.moe/v4/top/anime?filter=bypopularity`);
//     const data = await res.json();
//     displayAnime(data.data.slice(0,12));
// }
// // performig local storage for the favourite and recently viewed anime  
// localStorage.setItem("favouriteAnime", JSON.stringify([]));
// localStorage.setItem("recentlyViewedAnime", JSON.stringify([]));

// function addToFavourite(anime) {
//     let favouriteAnime = JSON.parse(localStorage.getItem("favouriteAnime"));
//     if (!favouriteAnime.some(a => a.mal_id === anime.mal_id)) {
//         favouriteAnime.push(anime);
//         localStorage.setItem("favouriteAnime", JSON.stringify(favouriteAnime));
//     }
// }

// function addToRecentlyViewed(anime) {
//     let recentlyViewedAnime = JSON.parse(localStorage.getItem("recentlyViewedAnime"));
//     if (!recentlyViewedAnime.some(a => a.mal_id === anime.mal_id)) {
//         recentlyViewedAnime.push(anime);
//         localStorage.setItem("recentlyViewedAnime", JSON.stringify(recentlyViewedAnime));
//     }
// }

// // adding click event to the anime cards to add them to recently viewed
// document.addEventListener("click", (e) => {
//     if (e.target.closest(".anime-card")) {
//         const animeId = e.target.closest(".anime-card").querySelector("h3").textContent;
//         const anime = {
//             mal_id: animeId,
//             title: e.target.closest(".anime-card").querySelector("h3").textContent,
//             image_url: e.target.closest(".anime-card").querySelector("img").src,
//             synopsis: e.target.closest(".anime-card").querySelector("p").textContent,
//             episodes: e.target.closest(".anime-card").querySelector("span").textContent.split(": ")[1]
//         };
//         addToRecentlyViewed(anime);
//     }
// });