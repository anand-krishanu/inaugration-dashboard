const socket = io();

// Fetch initial lamp status
fetch("/lamp-status")
    .then(response => response.json())
    .then(data => {
        document.getElementById("lamp").src = `/assets/lamp-${data.flamesLit}.png`;

        if (data.userClicked) {
            document.getElementById("light-btn").disabled = true;
        }

        if (data.flamesLit >= 5) {
            document.getElementById("light-btn").disabled = true;
        }
    });

// When user clicks "Light Lamp" button
document.getElementById("light-btn").addEventListener("click", () => {
    socket.emit("light-lamp");
});

// Update lamp image for all users in real-time
socket.on("update-lamp", (count) => {
    document.getElementById("lamp").src = `/assets/lamp-${count}.png`;

    if (count === 5) {
        playMusic();
        startFlowerShower();
    }
});

// Handle full lamp lighting
socket.on("lamp-lit", () => {
    playMusic();
    startFlowerShower();
});

// Prevent multiple clicks per user
socket.on("click-denied", (message) => {
    alert(message);
    document.getElementById("light-btn").disabled = true;
});

// Reset everything
socket.on("reset-lamp", () => {
    document.getElementById("lamp").src = "/assets/lamp-0.png";
    document.getElementById("light-btn").disabled = false;
    location.reload();
});

// Play music on lamp lighting
function playMusic() {
    // let audio = new Audio("/assets/audio-inaug.mp3");
    let audio = new Audio("/assets/audio-2.mp3");
    audio.volume = 0.3;
    audio.play().catch(error => {
        console.log("🔇 Audio autoplay blocked! User interaction required.");
    });
}


// Start flower shower animation
function startFlowerShower() {
    let flowerGif = document.querySelector(".flower-overlay");
    flowerGif.style.display = "block";

    setTimeout(() => {
        flowerGif.style.display = "none";
    }, 100000);
}