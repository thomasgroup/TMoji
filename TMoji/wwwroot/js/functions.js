var CurrentTheme = "Normal"; // default theme
var ShowPredictBox = false; //draw a canvas around the face
var ShowEmoji = true; // draw a emoji over the face
var ShowLandmarks = false; //draw the landmarks in the face (eyebrow, mouth, eyes)
var SoundClick = new Audio('rclick-13693.mp3'); // sound for SoundClick feedback
var DebugKey = "KeyD" //key to toggle debug mode


// dont touche
var ShowMenu = false;
var canPrint = true; 
var debug = false; 


$(function () {
    
    $(".cameraSelection").hide();
    $(".countdown").hide();
    window.onkeydown = logkey;

    function logkey(e) {
        if (e.code == DebugKey) {
            if (debug == false) {
                debug = true;
                $(".cameraSelection").show();
                return;
            }
            debug = false;
            $(".cameraSelection").hide();
        }
    }
});


//toggle the menu where select the theme
function ToggleMainMenu() {
    if (ShowMenu) {
        $(".menu").hide();
        ShowMenu = false;
        return;
    }
    $(".menu").show();
    ShowMenu = true;
}

//set the theme
//function called by button click
function SetTheme(theme) {
    CurrentTheme = theme;
    if (ShowMenu) {
        ToggleMainMenu();
    }
}

//function called by button click
function TogglePredictbox() {
    console.log(ShowPredictBox);
    SoundClick.play()
    if (ShowPredictBox) {
        ShowPredictBox = false;
        document.getElementById("option-box").classList.remove("option-item-active");
        return;
    }
     document.getElementById("option-box").classList.add("option-item-active");
    ShowPredictBox = true;
}


//function called by button click
function ToggleEmoji() {
    console.log(ShowEmoji);
    SoundClick.play()
    if (ShowEmoji) {
        ShowEmoji = false;
        document.getElementById("option-emoji").classList.remove("option-item-active");
        return;
    }
    document.getElementById("option-emoji").classList.add("option-item-active");
    ShowEmoji = true;
}

//function called by button click
function ToggleLandmarks() {
    console.log(ShowLandmarks);
    SoundClick.play()
    if (ShowLandmarks) {
        ShowLandmarks = false;
        document.getElementById("option-landmarks").classList.remove("option-item-active");
        return;
    }
    document.getElementById("option-landmarks").classList.add("option-item-active");
    ShowLandmarks = true;
}

// if canPrint = false, user can print a card
function ActivatePrinter() {
    canPrint = true;
}

// if canPrint = false, user can print a card
function DeactivatePrinter() {
    canPrint = false;
}

function Delay(delayInms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
}