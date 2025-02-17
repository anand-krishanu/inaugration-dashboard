const socket = io();

// Fetch the initial lamp state when the page loads
fetch("/lamp-status")
    .then(response => response.json())
    .then(data => {
        document.getElementById("lamp").src = `/assets/lamp-${data.flamesLit}.png`;

        // If the user's IP is already in the clicked list, disable the button
        if (data.userClicked) {
            document.getElementById("light-btn").disabled = true;
        }
    });

document.getElementById("light-btn").addEventListener("click", () => {
    socket.emit("light-lamp");
});

socket.on("update-lamp", (count) => {
    document.getElementById("lamp").src = `/assets/lamp-${count}.png`;

    if (count === 5) {
        playMusic();
        startFlowerShower();
    }
});

socket.on("lamp-lit", () => {
    playMusic();
    startFlowerShower();
});

socket.on("reset-lamp", () => {
    document.getElementById("lamp").src = "/assets/lamp-0.png";
    document.getElementById("light-btn").disabled = false;
    location.reload();
});

function playMusic() {
    let audio = new Audio("lamp-lit.mp3");
    audio.play();
}

function startFlowerShower() {
    let flowerGif = document.querySelector(".flower-overlay");
    flowerGif.style.display = "block";

    setTimeout(() => {
        flowerGif.style.display = "none";
    }, 10000);
}

document.getElementById("reset-btn").addEventListener("click", () => {
    fetch("/reset-lamp", { method: "POST" })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("Lamp has been reset!");
            }
        });
});