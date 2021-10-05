<script>
  const allColors = [
    "AliceBlue",
    "AntiqueWhite",
    "Aqua",
    "Aquamarine",
    "Azure",
    "Beige",
    "Bisque",
    "Black",
    "BlanchedAlmond",
    "Blue",
    "BlueViolet",
    "Brown",
    "BurlyWood",
    "CadetBlue",
    "Chartreuse",
    "Chocolate",
    "Coral",
    "CornflowerBlue",
    "Cornsilk",
    "Crimson",
    "Cyan",
    "DarkBlue",
    "DarkCyan",
    "DarkGoldenRod",
    "DarkGray",
    "DarkGrey",
    "DarkGreen",
    "DarkKhaki",
    "DarkMagenta",
    "DarkOliveGreen",
    "DarkOrange",
    "DarkOrchid",
    "DarkRed",
    "DarkSalmon",
    "DarkSeaGreen",
    "DarkSlateBlue",
    "DarkSlateGray",
    "DarkSlateGrey",
    "DarkTurquoise",
    "DarkViolet",
    "DeepPink",
    "DeepSkyBlue",
    "DimGray",
    "DimGrey",
    "DodgerBlue",
    "FireBrick",
    "FloralWhite",
    "ForestGreen",
    "Fuchsia",
    "Gainsboro",
    "GhostWhite",
    "Gold",
    "GoldenRod",
    "Gray",
    "Grey",
    "Green",
    "GreenYellow",
    "HoneyDew",
    "HotPink",
    "IndianRed",
    "Indigo",
    "Ivory",
    "Khaki",
    "Lavender",
    "LavenderBlush",
    "LawnGreen",
    "LemonChiffon",
    "LightBlue",
    "LightCoral",
    "LightCyan",
    "LightGoldenRodYellow",
    "LightGray",
    "LightGrey",
    "LightGreen",
    "LightPink",
    "LightSalmon",
    "LightSeaGreen",
    "LightSkyBlue",
    "LightSlateGray",
    "LightSlateGrey",
    "LightSteelBlue",
    "LightYellow",
    "Lime",
    "LimeGreen",
    "Linen",
    "Magenta",
    "Maroon",
    "MediumAquaMarine",
    "MediumBlue",
    "MediumOrchid",
    "MediumPurple",
    "MediumSeaGreen",
    "MediumSlateBlue",
    "MediumSpringGreen",
    "MediumTurquoise",
    "MediumVioletRed",
    "MidnightBlue",
    "MintCream",
    "MistyRose",
    "Moccasin",
    "NavajoWhite",
    "Navy",
    "OldLace",
    "Olive",
    "OliveDrab",
    "Orange",
    "OrangeRed",
    "Orchid",
    "PaleGoldenRod",
    "PaleGreen",
    "PaleTurquoise",
    "PaleVioletRed",
    "PapayaWhip",
    "PeachPuff",
    "Peru",
    "Pink",
    "Plum",
    "PowderBlue",
    "Purple",
    "RebeccaPurple",
    "Red",
    "RosyBrown",
    "RoyalBlue",
    "SaddleBrown",
    "Salmon",
    "SandyBrown",
    "SeaGreen",
    "SeaShell",
    "Sienna",
    "Silver",
    "SkyBlue",
    "SlateBlue",
    "SlateGray",
    "SlateGrey",
    "Snow",
    "SpringGreen",
    "SteelBlue",
    "Tan",
    "Teal",
    "Thistle",
    "Tomato",
    "Turquoise",
    "Violet",
    "Wheat",
    "White",
    "WhiteSmoke",
    "Yellow",
    "YellowGreen",
  ];

  let guess;
  let picked = [];
  let unpicked = allColors;
  let allColorsLower = allColors.map(v => v.toLowerCase());
  let unpickedLower = allColorsLower;
  let randomUnpickedColor =
    unpicked[Math.floor(Math.random() * unpicked.length)];
	let bonusList = [];

  function isValidColor(strColor) {
    let s = new Option().style;
    s.color = strColor;
    return s.color == strColor.toLowerCase();
  }

  function handleInput(e) {
    let colorGuess = e.target.value.toLowerCase();
    if (isValidColor(colorGuess) && !picked.includes(colorGuess) && !bonusList.includes(colorGuess)) {
      addColorBlock(colorGuess);
	  if(allColorsLower.includes(colorGuess)){
		updateLists(colorGuess);
	  }
	  else{
		bonusList=[...bonusList, colorGuess];
		document.getElementById("bonusCounter").style.display = "block";
	  }
      e.target.value = "";
      guess = colorGuess;
      if (colorGuess == randomUnpickedColor.toLowerCase()) {
        document.getElementById("hint").style.display = "none";
		document.getElementById("reveal").style.display = "none";
      }
    }
  }

  function updateLists(strColor) {
    unpickedLower = unpickedLower.filter((color) => color !== strColor);
    picked = [...picked, strColor];
  }

  function addColorBlock(strColor) {
    const newDiv = document.createElement("div");
    const newContent = document.createTextNode('"' + strColor + '"');
    newDiv.appendChild(newContent);
    newDiv.classList.add("colorBlock");
    newDiv.style.backgroundColor = strColor;
    newDiv.style.height = "100px";
    newDiv.style.width = "200px";
    newDiv.style.border = "1px solid black";
    newDiv.style.margin = "20px";
    newDiv.style.borderRadius = "50px";
    newDiv.style.lineHeight = "90px";
    newDiv.style.fontSize = "20px";

    document.getElementById("list").appendChild(newDiv);
  }

  let reveal = 3;

  function getHint() {
    randomUnpickedColor = unpickedLower[Math.floor(Math.random() * unpickedLower.length)];
	document.getElementById("hint").style.display="block";
    document.getElementById("hint").innerHTML =
      "Hint:" +
      randomUnpickedColor[0] +
      randomUnpickedColor[1] +
      "..." +
      randomUnpickedColor[randomUnpickedColor.length - 1];
    document.getElementById("hint").style.border =
      "5px solid " + randomUnpickedColor;
    document.getElementById("reveal").style.display = "block";
    reveal = 3;
	document.getElementById("input").focus();
  }

  function revealMore() {
    let length = randomUnpickedColor.length;
    let newHint = "";
    for (let i = 0; i < length; i++) {
      if (i < reveal || i > length - reveal) {
        newHint += randomUnpickedColor[i];
      } else {
        newHint += ".";
      }
    }
    document.getElementById("hint").innerHTML = "Hint:" + newHint;
    reveal++;
  }
</script>

<main style="background: {guess};">
  <h1>Is It A Color?</h1>
  <p>Type a color below to check!</p>

  <input type="text" on:input={handleInput} id = "input"/>
  <button on:click={getHint}>Hint</button>

  <p>Score: {picked.length} / 148</p>
  <p id="bonusCounter"> BONUS POINTS: {bonusList.length}</p>

  <div id="hint" />
  <button id="reveal" on:click={revealMore}>Reveal More</button>
  <div id="list" />
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
    min-height: 100vh;
  }
  p {
    background-color: rgba(255, 255, 255, 50%);
    border-radius: 8px;
    padding: 2px 5px 3px;
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
  }

  #hint {
    border-radius: 8px;
    width: fit-content;
    margin: auto;
    padding: 5px;
	background: white;
	display: none;
  }
  #bonusCounter{
	  display: none;
  }
  #reveal {
    display: none;
    margin: auto;
  }

  #list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap-reverse;
    justify-content: center;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
    -webkit-text-stroke-width: 1px;
    -webkit-text-stroke-color: black;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
