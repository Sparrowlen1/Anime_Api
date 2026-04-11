const input = document.getElementById("searchinput");
const button = document.getElementById("searchbtn");
const genres = document.getElementById("genres");
const favourite = document.getElementById("favourite");
const homebutton = document.getElementById("homebutton");
const viewed = document.getElementById("recentlyviewed");


button.addEventListener("click", () => {
  const question = input.value;
  fetchAnime(question);
});

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const question = input.value;
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
  animeList.slice(0, 6).forEach((anime) => {
    const card = document.createElement("div");
    card.classList.add("anime-card");
    card.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
            <h3>${anime.title}</h3>
            <p>${anime.synopsis ? anime.synopsis.slice(0, 10) : "No description"}...</p>
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
    displayAnime(data.data.slice(0,6));
}