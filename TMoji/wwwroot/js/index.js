//dont touche
const emojiPath = '/images/Emojis';
let fps = 0;
var frameCount = 0;
var startTime = Date.now();
let lastTime = 0;
var counter = 0;
var detections = null;
var resizedDetections = null;
var imageCollection = []
var ageValues = [];
var videoElement = document.getElementById('videoElement');
var emotionText;
var emotionTextPokemon;

var runTicker = false;
var lastFoundsTicksAgo = 0;
var lastDetection = undefined;
var oldDetections = null;

var EmotionDetections = undefined;
var resizedEmotionDetections = null;

const mobbileOptions = new faceapi.SsdMobilenetv1Options({ maxResults: 3 }); //Initialized the model via the Face API. maxResults represents the number of faces that can be detected simultaneously
var DisplaySizeX = window.screen.width; //Display size
var DisplaySizeY = window.screen.height; //Display size
//var DisplaySizeX = 3840; //Display size
//var DisplaySizeY = 2160; //Display size


var VideoPrepareHeight = 240;
var VideoPrepareWidth = 426;
//var CameraOptions = { //camera options it is importan for best quality
//    ["height"] = 3840,
//    ["width"] = 2160,
//    ["fps"] = 60,
//}

var CameraOptions = {
    height: 3840,
    width: 2160,
    fps: 60
};

const Lang = {
    ["Already_Print_Card"]: "Du hast schon diese Karte ausgedruckt!",
    ["NoMail"]: "Bitte gib deine Email an, damit wir deine Emotion Card an dich senden können.",

}


//sound while create a random card
var CountDownSound = new Audio('arcade-countdown-7007.mp3');
var TadaSound = new Audio('tada-fanfare-a-6313.mp3');








// see DrawBoxOptions below
const drawOptions = {
    label: 'Hello I am rra box!',
    lineWidth: 2,
    border: 'solid red',
    boxColor: 'rgba(0, 169, 132, 0.8)'
}
var lastHighestValue = null;
var canvestemp = document.createElement('canvas');
var existingcanvesctx;
$(async function () {

    canvestemp.height = VideoPrepareHeight;
    canvestemp.width = VideoPrepareWidth;

    existingcanvesctx = canvestemp.getContext("2d", { willReadFrequently: true });

    //load all emojis
    GetFilePaths()
        .then(filePaths => {
            for (var i = 0; i < filePaths.length; i++) {
                const img = new Image();
                img.src = filePaths[i];

                imageCollection.push(img);
            }
        });

    $("#myModal").on('hidden.bs.modal', function () {
        ActivatePrinter();
    });


    $(".menu").hide();

    GetEmotionJson();
    GetEmotionPokemonJson();

    //loads models
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/js/dist/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/js/dist/models')
    await faceapi.nets.ageGenderNet.loadFromUri('/js/dist/models')
    await faceapi.nets.faceExpressionNet.loadFromUri('/js/dist/models')

    //get all cameras from device
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            var cameraSelect = document.getElementById('cameraSelect');

            //check only video inputs
            var videoDevices = devices.filter(function (device) {
                return device.kind === 'videoinput';
            });

            //create options for video inputs
            videoDevices.forEach(function (device, index) {
                var option = document.createElement('option');
                option.value = device.deviceId;
                option.text = 'Kamera ' + (index + 1) + `: ${device.label}`;
                cameraSelect.appendChild(option);
            });
        })
        .catch(function (error) {
            console.error('error while creating camera-options', error);
        });



    //call this event if the camera input was changed
    var cameraSelect = document.getElementById('cameraSelect');
    cameraSelect.addEventListener('change', startStream);




    //camera update event
    videoElement = document.getElementById('videoElement');
    videoElement.addEventListener('timeupdate', async function () {
        counter++;
    });

    startStream();
    RunTicker();

});

var emotionRandomIndex = []
var randomIndex = 1;
//Detect expressions


async function detectExpression() {
    console.log(lastFoundsTicksAgo)
    if (lastFoundsTicksAgo > 3) {
        lastFoundsTicksAgo = 0;
        lastDetection = undefined;
        return;
    }
    var canvas = document.getElementById('feed');
    const ctx = canvas.getContext('2d');
    var video = document.getElementById('videoElement')

    //set the image size
    canvas.width = DisplaySizeX;
    canvas.height = DisplaySizeY;
    const displaySize = { width: canvas.width, height: canvas.height }

    //get Detections from the actual frame
    //Draw screenshot from the camerafeed
    existingcanvesctx.drawImage(video, 0, 0, canvestemp.width, canvestemp.height);

    detections = await faceapi.detectAllFaces(canvestemp, mobbileOptions).withFaceLandmarks().withFaceExpressions().withAgeAndGender();
    resizedDetections = await faceapi.resizeResults(detections, displaySize);


    var emotionDetections = EmotionDetections



    if (detections.length > 0)
        lastDetection = detections;

    //loop all detections
    if (lastFoundsTicksAgo > 0 && lastDetection != undefined && detections.length == 0) {
        console.log("use last predict")
        resizedDetections = await faceapi.resizeResults(lastDetection, displaySize);
        for (var i = 0; i < lastDetection.length; i++) {
            let sortedObj = Object.entries(lastDetection[i].expressions).sort((a, b) => b[1] - a[1]);
            let highestValueObj = sortedObj[0];

            let sortedEmotionObj = Object.entries(emotionDetections[i]?.expressions ?? lastDetection[i].expressions).sort((a, b) => b[1] - a[1]);
            var emotionValue = sortedEmotionObj[0];

            var dbox = resizedDetections[i].alignedRect.box;

            drawOptions.label = `Emotion: ${highestValueObj[0]} Alter: ${calculateage(lastDetection[i].age)}`;

            //if show Prediction box, draw a box around the face
            if (ShowPredictBox) {
                const box = { x: dbox.x, y: dbox.y - 50, width: dbox.width, height: dbox.height + 50 }
                const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
                drawBox.draw(canvas);
            }

            //if show emoji, draw the emoji over the face
            if (ShowEmoji && emotionValue.length > 0) {
                if (CurrentTheme === "Pokemon") {
                    if (hasEmotionChanged(i, highestValueObj[0])) {
                        // Wenn sich highestValueObj[0] geändert hat, neuen randomIndex berechnen
                        randomIndex = Math.floor(Math.random() * 2) + 1;
                        if (emotionRandomIndex.length < i) {
                            emotionRandomIndex.push(randomIndex);
                        } else {
                            emotionRandomIndex[i] = randomIndex;
                        }
                    }

                    const imgpath = `https://${window.location.host}${emojiPath}/${CurrentTheme}/${highestValueObj[0]}/${emotionRandomIndex[i] ?? 1}.png`;
                    const img = FindImageBySrc(imageCollection, imgpath);
                    ctx.drawImage(img, dbox.x, dbox.y - 50, dbox.width, dbox.height + 50);


                } else {
                    imgpath = `https://${window.location.host}${emojiPath}/${CurrentTheme}/${highestValueObj[0]}.png`;
                    const img = FindImageBySrc(imageCollection, imgpath)
                    ctx.drawImage(img, dbox.x, dbox.y - 50, dbox.width, dbox.height + 50);
                }
            }

            //if show landmarks, draw landmark over eyes, mouth and eyebrow
            if (ShowLandmarks) {
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
            }
        }
    } else {
        console.log("use current predict")
        lastFoundsTicksAgo = 0;
        for (var i = 0; i < detections.length; i++) {
            let sortedObj = Object.entries(detections[i].expressions).sort((a, b) => b[1] - a[1]);
            let highestValueObj = sortedObj[0];
            let sortedEmotionObj = Object.entries(emotionDetections[i]?.expressions ?? detections[i].expressions).sort((a, b) => b[1] - a[1]);
            var emotionValue = sortedEmotionObj[0];

            var dbox = resizedDetections[i].alignedRect.box;

            drawOptions.label = `Emotion: ${highestValueObj[0]} Alter: ${calculateage(detections[i].age)}`;

            //if show Prediction box, draw a box around the face
            if (ShowPredictBox) {
                const box = { x: dbox.x, y: dbox.y - 50, width: dbox.width, height: dbox.height + 50 }
                const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
                drawBox.draw(canvas);
            }

            //if show emoji, draw the emoji over the face
            if (ShowEmoji && emotionValue.length > 0) {
                if (CurrentTheme === "Pokemon") {
                    if (hasEmotionChanged(i, highestValueObj[0])) {
                        // Wenn sich highestValueObj[0] geändert hat, neuen randomIndex berechnen
                        randomIndex = Math.floor(Math.random() * 2) + 1;
                        if (emotionRandomIndex.length < i) {
                            emotionRandomIndex.push(randomIndex);
                        } else {
                            emotionRandomIndex[i] = randomIndex;
                        }
                    }

                    const imgpath = `https://${window.location.host}${emojiPath}/${CurrentTheme}/${highestValueObj[0]}/${emotionRandomIndex[i] ?? 1}.png`;
                    const img = FindImageBySrc(imageCollection, imgpath);
                    ctx.drawImage(img, dbox.x, dbox.y - 50, dbox.width, dbox.height + 50);


                } else {
                    imgpath = `https://${window.location.host}${emojiPath}/${CurrentTheme}/${highestValueObj[0]}.png`;
                    const img = FindImageBySrc(imageCollection, imgpath)
                    ctx.drawImage(img, dbox.x, dbox.y - 50, dbox.width, dbox.height + 50);
                }
            }

            //if show landmarks, draw landmark over eyes, mouth and eyebrow
            if (ShowLandmarks) {
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
            }
        }


    }

    oldDetections = detections;

    if (detections.length == 0 || emotionDetections.length == 0)
        lastFoundsTicksAgo++;
}


async function EmotionDetection() {
    if (lastFoundsTicksAgo > 3) {
        emotionDetection = undefined;
        return;
    }

    var canvas = document.getElementById('feed');
    const displaySize = { width: canvas.width, height: canvas.height }


    var _detections = await faceapi.detectAllFaces(canvestemp, mobbileOptions).withFaceLandmarks().withFaceExpressions();
    resizedEmotionDetections = await faceapi.resizeResults(_detections, displaySize);
    if (detections.length > 0 && lastFoundsTicksAgo < 3)
        EmotionDetections = _detections;
    //loop all detections
}


function FindImageBySrc(imagesArray, src) {
    var fimg = imagesArray.find(function (image) {
        return image.src === src;
    });

    return fimg
}


function GetFilePaths() {
    return fetch('/api/TMoji/GetFilePaths')
        .then(response => response.json())
        .catch(error => {
            console.error('Error retrieving file paths:', error);
            return [];
        });
}


//starts streaming from the video device
async function startStream() {
    var selectedCameraId = cameraSelect.value;
    var constraints = { video: { deviceId: selectedCameraId, height: CameraOptions["height"], width: CameraOptions["widht"], frameRate: { ideal: CameraOptions["fps"], max: CameraOptions["fps"] } } };

    fps = 0;
    frameCount = 0;
    lastTime = 0;


    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            var videoElement = document.getElementById('videoElement');
            videoElement.srcObject = stream;
            stream.height

            lastTime = performance.now();
            //frameCount = 1;
            //CountFPS(lastTime);
        })
        .catch(function (error) {
            console.error('Error accessing webcam:', error);
        });

}



//calculate fps
function CountFPS(currentTime) {

    if (frameCount == 0) {
        frameCount++
        return;
    }
    frameCount++;
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= 1000) {
        fps = Math.round(frameCount / (deltaTime / 1000));
        frameCount = 1;
        lastTime = currentTime;
    }

    //set the fps count to html element
    var fpsDisplay = document.getElementById('fpsDisplay');
    fpsDisplay.textContent = 'FPS: ' + fps;

    requestAnimationFrame(CountFPS);
}

////////////////////////////////////
function TakeScreenshot() {
    console.log("take screen wird aufgerufen")

    var sec = 3;
    document.getElementById("Sec").innerHTML = sec + ""
    $(".CountDownSound").show();
    $(".btn-screenshot").hide();

    CountDownSound.play();
    var x = setInterval(async function () {
        sec--;
        // Display the result in the element with id="demo"
        document.getElementById("Sec").innerHTML = sec + "";
        // If the count down is finished, write some text

        if (sec <= 0) {

            $(".btn-screenshot").show();
            $(".CountDownSound").hide();
            TadaSound.play();
            clearInterval(x);
            document.getElementById("Sec").innerHTML = "";


            var video = document.getElementById('videoElement'); //getting the camerafeed

            var existingCanvas = document.createElement('canvas');
            existingCanvas.height = 600;
            existingCanvas.width = 800;

            const displaySize = { width: existingCanvas.width, height: existingCanvas.height }

            //detect faces 

            var existingctx = existingCanvas.getContext('2d');

            //Draw screenshot from the camerafeed
            existingctx.drawImage(video, 0, 0, existingCanvas.width, existingCanvas.height);
            console.log("screenshot wird erstellt");

            var emotionDetections = EmotionDetections


            //Draw Predictbox, emoji and landmarks over every face wich is detected in the last camera timeupdate event

            if (lastFoundsTicksAgo == 0 && emotionDetections.length > 0) {
                const resizedDetections = await faceapi.resizeResults(emotionDetections, displaySize);
                for (var i = 0; i < emotionDetections.length; i++) {
                    var age = calculateage(resizedDetections[i]
                        .age) //set the age based on the avarage of the last 10 detections
                    let sortedObj = Object.entries(emotionDetections[i].expressions).sort((a, b) => b[1] - a[1]);
                    var highestValueObj = sortedObj[0]; //set the emotion wich is mostly detected
                    var gender = detections[i].gender;
                    var dbox = resizedDetections[i].alignedRect.box;
                    drawOptions.label = highestValueObj[0];

                    if (ShowPredictBox) {
                        const box = { x: dbox.x, y: dbox.y - 50, width: dbox.width, height: dbox.height + 50 }
                        const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
                        drawBox.draw(existingCanvas);
                    }

                    if (ShowEmoji) {
                        if (CurrentTheme === "Pokemon") {
                            var image = new Image();
                            image.src = `https://${window.location.host}${emojiPath}/${CurrentTheme}/${highestValueObj[0]}/${randomIndex}.png`;

                            // Das Bild mit der gewünschten Größe zeichnen
                            existingctx.drawImage(image, dbox.x, dbox.y - 50, dbox.width, dbox.height + 50);
                        } else {
                            var image = new Image();
                            image.src = `https://${window.location.host}${emojiPath}/${CurrentTheme}/${highestValueObj[0]}.png`;

                            // Das Bild mit der gewünschten Größe zeichnen
                            existingctx.drawImage(image, dbox.x, dbox.y - 50, dbox.width, dbox.height + 50);
                        }
                    }

                    if (ShowLandmarks) {
                        faceapi.draw.drawFaceLandmarks(existingCanvas, resizedDetections)
                    }
                }
            } else {
                const resizedDetections = await faceapi.resizeResults(lastDetection, displaySize);
                for (var i = 0; i < lastDetection.length; i++) {
                    var age = calculateage(resizedDetections[i]
                        .age) //set the age based on the avarage of the last 10 detections
                    let sortedObj = Object.entries(lastDetection[i].expressions).sort((a, b) => b[1] - a[1]);
                    var highestValueObj = sortedObj[0]; //set the emotion wich is mostly detected
                    var gender = lastDetection[i].gender;
                    var dbox = resizedDetections[i].alignedRect.box;
                    drawOptions.label = highestValueObj[0];

                    if (ShowPredictBox) {
                        const box = { x: dbox.x, y: dbox.y - 50, width: dbox.width, height: dbox.height + 50 }
                        const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
                        drawBox.draw(existingCanvas);
                    }

                    if (ShowEmoji) {
                        if (CurrentTheme === "Pokemon") {
                            var image = new Image();
                            image.src = `https://${window.location.host}${emojiPath}/${CurrentTheme}/${highestValueObj[0]}/${randomIndex}.png`;

                            // Das Bild mit der gewünschten Größe zeichnen
                            existingctx.drawImage(image, dbox.x, dbox.y - 50, dbox.width, dbox.height + 50);
                        } else {
                            var image = new Image();
                            image.src = `https://${window.location.host}${emojiPath}/${CurrentTheme}/${highestValueObj[0]}.png`;

                            // Das Bild mit der gewünschten Größe zeichnen
                            existingctx.drawImage(image, dbox.x, dbox.y - 50, dbox.width, dbox.height + 50);
                        }
                    }

                    if (ShowLandmarks) {
                        faceapi.draw.drawFaceLandmarks(existingCanvas, resizedDetections)
                    }
                }
            }

            $('#pokemonLay').off('click');
            $('#yogioLay').off('click');

            $('#pokemonLay').on('click', function () {
                console.log("pokelay wird erstellt")

                pokeLay(highestValueObj, existingCanvas, gender, age);

            });


            $('#yogioLay').on('click', function () {

                console.log("yogilay wird erstellt")

                yogiLay(highestValueObj, existingCanvas, gender, age);


            });

            $('#layout').modal('show');//Show modal with the sesult

            console.log("modal wird aufgerufen")

        }
    }, 1000);
}

function yogiLay(highestValueObj, existingCanvas, gender, age) {

    //Create Layout instance
    var laoutCanvas = document.getElementById('Screenshot');
    var layoutContext = laoutCanvas.getContext('2d');
    var image = new Image();



    //Roll Layout grade and open Modal with the result showing as imge
    const roll = Math.floor(Math.random() * 100);
    console.log(roll);

    var grade;

    if (highestValueObj == null)
        return;

    if (highestValueObj[0] == "fearful") {
        grade = "gold";
        //gold
        if (Math.floor(Math.random() * 2) == 0)
            image.src = 'images/Layouts/gold.png';
        else
            image.src = 'images/Layouts/gold2.png';
        $('#modalTitel').html("Thomas Emotion Card - LEGENDÄR!");
    } else if (roll >= 0 && roll < 40) {
        //grün
        grade = "green";
        image.src = 'images/Layouts/TMojiHQLayout1.png';
        $('#modalTitel').html("Thomas Emotion Card - Gewöhnlich");
    } else if (roll >= 40 && roll < 70) {
        //blau
        grade = "blue";
        image.src = 'images/Layouts/blue.png';
        $('#modalTitel').html("Thomas Emotion Card - Selsten");
    } else if (roll >= 70 && roll < 90) {
        //violet
        grade = "violet";
        image.src = 'images/Layouts/violet.png';
        $('#modalTitel').html("Thomas Emotion Card - Episch!");
    } else if (roll >= 90) {
        //gold
        grade = "gold";
        if (Math.floor(Math.random() * 2) == 0)
            image.src = 'images/Layouts/gold.png';
        else
            image.src = 'images/Layouts/gold2.png';
        $('#modalTitel').html("Thomas Emotion Card - GOLD!");
    }

    //Set the onload event of the image to render the layout, screenshot and the Content for the Tmoji-Card
    image.onload = function () {
        laoutCanvas.width = image.naturalWidth;
        laoutCanvas.height = image.naturalHeight;
        //Draw Layout
        layoutContext.drawImage(image, 0, 0,);

        //draw Screenshot cam
        layoutContext.drawImage(existingCanvas, 57, 152, 475, 438);
        console.log("yogi screenshot")




        //Get Text from JSONFile via emotionText Variable and filter via random roll and depanding grade

        if (CurrentTheme === "Pokemon") {
            var emotionValues = emotionTextPokemon.Emotions[highestValueObj[0]].filter(entry => entry.grade == randomIndex);
            var emotion = emotionValues[Math.floor(Math.random() * emotionValues.length)]

        } else {
            var emotionValues = emotionText.Emotions[highestValueObj[0]].filter(entry => entry.grade == grade);
            var emotion = emotionValues[Math.floor(Math.random() * emotionValues.length)]
        }


        //Draw Titel
        var fontColor = "White"; // FontColor
        var fontSize = "32px"; // Fontsize
        var fontFamily = "Mongolian Baiti"; // Fontfamily

        layoutContext.fillStyle = fontColor;
        layoutContext.font = " " + fontSize + " " + fontFamily;
        layoutContext.fillText(emotion.name, 60, 82); // Text

        //Draw DescriptionTitel
        var fontColor = "Black"; // FontColor
        var fontSize = "22px"; // Fontsize
        var fontFamily = "Mongolian Baiti"; // Fontfamily

        layoutContext.fillStyle = fontColor;
        layoutContext.font = "bold " + fontSize + " " + fontFamily;
        layoutContext.fillText("[" + highestValueObj[0].charAt(0).toUpperCase() + highestValueObj[0].slice(1) + "]", 48, 645); // Text

        //Draw Description
        var fontColor = "Black"; // FontColor
        var fontSize = "17px"; // Fontsize
        var fontFamily = "Mongolian Baiti"; // Fontfamily

        var maxWidth = 650; // Maxwidht for the Text (causes textbreaks)

        var text = emotion.description; //Text for the description
        var words = text.split(" ");
        var line = "";
        var lines = [];

        for (var i = 0; i < words.length; i++) {
            var testLine = line + words[i] + " ";
            var metrics = layoutContext.measureText(testLine);
            var testWidth = metrics.width;

            if (testWidth > maxWidth) {
                lines.push(line);
                line = words[i] + " ";
            } else {
                line = testLine;
            }
        }

        lines.push(line);
        layoutContext.fillStyle = fontColor;
        layoutContext.font = " " + fontSize + " " + fontFamily;
        var lineHeight = 20;
        var y = 668;
        for (var j = 0; j < lines.length; j++) {
            layoutContext.fillText(lines[j], 48, y);
            y += lineHeight;
        }

        //Draw Age n Gender
        var fontColor = "Black"; // FontColor
        var fontSize = "17px"; // Fontsize
        var fontFamily = "Mongolian Baiti"; // Fontfamily

        layoutContext.fillStyle = fontColor;
        layoutContext.font = " " + fontSize + " " + fontFamily;
        layoutContext.fillText(`Geschlecht/ ${gender.charAt(0).toUpperCase()} Alter/ ${age}`, 375, 782); // Text
    };

    $('#myModal').modal('show');//Show modal with the sesult
    console.log("yogilay modal geladen")
    $(".btn-screenshot").show();

}
function pokeLay(highestValueObj, existingCanvas, gender, age) {

    //Create Layout instance
    var laoutCanvas = document.getElementById('Screenshot');
    var layoutContext = laoutCanvas.getContext('2d');
    var image = new Image();

    //Roll Layout grade and open Modal with the result showing as imge
    const roll = Math.floor(Math.random() * 100);
    console.log(roll);

    var grade;


    if (highestValueObj == null)
        return;


    if (highestValueObj[0] == "fearful") {
        grade = "gold";

        image.src = 'images/Layouts/fearful.png';

        $('#modalTitel').html("Thomas Emotion Card - fearful");
    } else if (highestValueObj[0] == "angry") {
        //grün
        grade = "green";
        image.src = 'images/Layouts/angry.png';
        $('#modalTitel').html("Thomas Emotion Card - angry");
    } else if (highestValueObj[0] == "disgusted") {
        //blau
        grade = "blue";
        image.src = 'images/Layouts/disgusted.png';
        $('#modalTitel').html("Thomas Emotion Card - disgusted");
    } else if (highestValueObj[0] == "happy") {
        //violet
        grade = "violet";

        image.src = 'images/Layouts/happyl.png';
        $('#modalTitel').html("Thomas Emotion Card - happy");
    } else if (highestValueObj[0] == "neutral") {
        //green
        grade = "green";
        image.src = 'images/Layouts/neutral.png';
        $('#modalTitel').html("Thomas Emotion Card - neutral");
    } else if (highestValueObj[0] == "sad") {
        //blau
        grade = "blue";
        image.src = 'images/Layouts/sad.png';
        $('#modalTitel').html("Thomas Emotion Card - sad");
    } else if (highestValueObj[0] == "surprised") {
        //violet
        grade = "violet";
        image.src = 'images/Layouts/surprised.png';
        $('#modalTitel').html("Thomas Emotion Card - surprised");
    }

    //Set the onload event of the image to render the layout, screenshot and the Content for the Tmoji-Card
    image.onload = function () {
        laoutCanvas.width = image.naturalWidth;
        laoutCanvas.height = image.naturalHeight;
        //Draw Layout
        layoutContext.drawImage(image, 0, 0,);

        //draw Screenshot cam
        layoutContext.drawImage(existingCanvas, 71, 145, 610, 357);
        console.log("poke screenshot")

        //Get Text from JSONFile via emotionText Variable and filter via random roll and depanding grade

        if (CurrentTheme === "Pokemon") {
            var emotionValues =
                emotionTextPokemon.Emotions[highestValueObj[0]].filter(entry => entry.grade == randomIndex);
            var emotion = emotionValues[Math.floor(Math.random() * emotionValues.length)]

        } else {
            var emotionValues = emotionText.Emotions[highestValueObj[0]].filter(entry => entry.grade == grade);
            var emotion = emotionValues[Math.floor(Math.random() * emotionValues.length)]
        }

        //Draw Titel
        var fontColor = "Black"; // FontColor
        var fontSize = "40px"; // Fontsize
        var fontFamily = "Mongolian Baiti"; // Fontfamily


        layoutContext.fillStyle = fontColor;
        layoutContext.font = "bold " + fontSize + " " + fontFamily;
        layoutContext.fillText(emotion.name, 60, 100); // Text

        //Draw DescriptionTitel
        var fontColor = "Black"; // FontColor
        var fontSize = "50px"; // Fontsize
        var fontFamily = "Mongolian Baiti"; // Fontfamily

        layoutContext.fillStyle = fontColor;
        layoutContext.font = "bold " + fontSize + " " + fontFamily;
        layoutContext.fillText(
            "" + highestValueObj[0].charAt(0).toUpperCase() + highestValueObj[0].slice(1) + "",
            300,
            675); // Text

        //Draw Description
        var fontColor = "Black"; // FontColor
        var fontSize = "24px"; // Fontsize
        var fontFamily = "Mongolian Baiti"; // Fontfamily

        var maxWidth = 800; // Maxwidht for the Text (causes textbreaks)

        var text = emotion.description; //Text for the description
        var words = text.split(" ");
        var line = "";
        var lines = [];

        for (var i = 0; i < words.length; i++) {
            var testLine = line + words[i] + " ";
            var metrics = layoutContext.measureText(testLine);
            var testWidth = metrics.width;

            if (testWidth > maxWidth) {
                lines.push(line);
                line = words[i] + " ";
            } else {
                line = testLine;
            }
        }

        lines.push(line);
        layoutContext.fillStyle = fontColor;
        layoutContext.font = " " + fontSize + " " + fontFamily;
        var lineHeight = 24;
        var y = 800;
        for (var j = 0; j < lines.length; j++) {
            layoutContext.fillText(lines[j], 200, y);
            y += lineHeight;
        }

        //Draw Age n Gender
        var fontColor = "Black"; // FontColor
        var fontSize = "32px"; // Fontsize
        var fontFamily = "Mongolian Baiti"; // Fontfamily

        layoutContext.fillStyle = fontColor;
        layoutContext.font = " " + fontSize + " " + fontFamily;
        layoutContext.fillText(`Geschlecht/ ${gender.charAt(0).toUpperCase()} Alter/ ${age}`, 225, 567); // Text
    };

    $('#myModal').modal('show'); //Show modal with the sesult
    console.log("poke modal geladen")
    $(".btn-screenshot").show();


}

function PrintScreenshot() {
    //show error msg to ui when canPrint is false
    if (canPrint == false) {
        $('#fail').html(Lang["Already_Print_Card"]);
        $("#failed").removeClass('d-none').fadeTo(6000, 500).slideUp(500,
            function () {
                $("#failed").slideUp(500, function () { $('#failed').addClass('d-none') });
            });
        return;
    }

    DeactivatePrinter();

    $('#printBtn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm"></span>');
    var laoutCanvas = document.getElementById('Screenshot');

    var imgData = laoutCanvas.toDataURL('image/png');
    $.ajax({
        url: 'api/TMoji/PrintImage',
        type: 'POST',
        data: { image: imgData },
        dataType: 'json',
        success: function () {
            $('#printBtn').prop("disabled", false).html('<i class="bi bi-printer">');
        },
        error: function (request, error) {
            console.log(request);
            console.log(error);
            $('#printBtn').prop("disabled", false).html('<i class="bi bi-printer">');
        }
    });


}

//Send email via ajax call to the backand http api
function sendMail() {
    var mail = $('#email').val();

    $('#emailBtn').prop("disabled", true).html('<span class="spinner-border spinner-border-sm"></span>');

    if (mail == "" || mail == undefined) {
        $('#fail').html(Lang["NoMail"]);
        $("#failed").removeClass('d-none').fadeTo(6000, 500).slideUp(500,
            function () {
                $("#failed").slideUp(500, function () { $('#failed').addClass('d-none') });
            });

        $('#emailBtn').prop("disabled", false).html('<i class="bi bi-envelope-at">');
        return;
    }

    var laoutCanvas = document.getElementById('Screenshot');

    var dataURL = laoutCanvas.toDataURL();


    $.ajax({
        url: 'api/TMoji/SendMail',
        type: 'POST',
        data: { email: mail, image: dataURL },
        dataType: 'json',
        success: function () {
            //$('#success').removeClass('d-none').addClass('show');
            $('#EMailAddress').html(mail);
            $("#success").removeClass('d-none').fadeTo(6000, 500).slideUp(500,
                function () {
                    $("#success").slideUp(500, function () { $('#success').addClass('d-none') });
                });


            $('#emailBtn').prop("disabled", false).html('<i class="bi bi-envelope-at">');


            $("#email").val("");

        },
        error: function (request, error) {

            $('#fail').html(request.responseText);
            $("#failed").removeClass('d-none').fadeTo(6000, 500).slideUp(500,
                function () {
                    $("#failed").slideUp(500, function () { $('#failed').addClass('d-none') });
                });
            $('#emailBtn').prop("disabled", false).html('<i class="bi bi-envelope-at">');

            $("#email").val("");

        }
    });
}

//calculate the age based on the last 10 detected ages.
function calculateage(newValue) {
    ageValues.push(newValue);

    ageValues = ageValues.sort((a, b) => a - b);

    if (ageValues.length > 11) {
        ageValues.shift();
        ageValues.pop();
    }

    var avarage = ageValues.reduce((sum, value) => sum + value, 0) / ageValues.length;
    var age = document.getElementById('age');
    return Math.round(avarage);
}

//Load the card textcontent from the Json file
function GetEmotionJson() {

    fetch('/EmotionText.json')
        .then(response => response.json())
        .then(data => {
            // Hier hast du Zugriff auf das eingelesene JSON-Objekt
            emotionText = data;
        })
        .catch(error => {
            // Fehlerbehandlung, falls beim Laden oder Parsen der JSON-Datei ein Fehler auftritt
            console.error('Fehler beim Laden der JSON-Datei:', error);
        });


}

function GetEmotionPokemonJson() {

    fetch('/EmotionTextPokemon.json')
        .then(response => response.json())
        .then(data => {
            // Hier hast du Zugriff auf das eingelesene JSON-Objekt
            emotionTextPokemon = data;
        })
        .catch(error => {
            // Fehlerbehandlung, falls beim Laden oder Parsen der JSON-Datei ein Fehler auftritt
            console.error('Fehler beim Laden der JSON-Datei:', error);
        });


}

function hasEmotionChanged(pos, emotion) {
    if (oldDetections.length == 0) {
        return false;
    }
    let sortedObj = Object.entries(oldDetections[pos]?.expressions).sort((a, b) => b[1] - a[1]);
    let highestValueObj = sortedObj[0];
    if (emotion == highestValueObj[0])
        return false;

    return true;

}

async function RunTicker() {


    const interval = setInterval(i => {
        detectExpression()
    },
        1)

    const emotionInterval = setInterval(i => {
        EmotionDetection();
    }, 500);
    //if (runTicker == true) {
    //    return;
    //}

    //const tickWorker = new Worker("js/Ticker.js");
    //tickWorker.postMessage({ type: "start" })
    //runTicker = true;
    ////var ready = true;
    //tickWorker.onmessage = function (event) {
    //    if (event.data.event == "onTick") {
    //       /* if (ready) {*/
    //            ready = false;
    //            detectExpression()
    //            ready = true;
    //        //}
    //    }

    //    if (event.data.event == "onTickEnd") {
    //        runTicker = false;
    //        tickWorker.terminate();
    //    }
    //}

}

