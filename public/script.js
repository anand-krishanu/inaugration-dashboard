const socket = io();
let hasClicked = localStorage.getItem('hasClicked') === 'true';

document.getElementById('light-btn').disabled = hasClicked;

document.getElementById('light-btn').addEventListener('click', () => {
    if (!hasClicked) {
        socket.emit('light-lamp');
        hasClicked = true;
        localStorage.setItem('hasClicked', 'true');
        document.getElementById('light-btn').disabled = true;
    }
});

// socket.on('update-lamp', (count) => {
//     document.getElementById('click-count').innerText = count;
//     document.getElementById('lamp').src = `/assets/lamp-${count}.png`;
// });

socket.on('update-lamp', (count) => {
    document.getElementById('lamp').src = `/assets/lamp-${count}.png`;
    
    if (count === 5) {
        playMusic();
        startFlowerShower();
    }
});



socket.on('lamp-lit', () => {
    playMusic();
    startFlowerShower();
});

socket.on("reset-lamp", () => {
    localStorage.removeItem("hasClicked");
    document.getElementById("lamp").src = "/assets/lamp-0.png";
    document.getElementById("light-btn").disabled = false;
    location.reload();
});

function playMusic() {
    let audio = new Audio('lamp-lit.mp3');
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


// function startFlowerShower() {
//     for (let i = 0; i < 30; i++) {
//         let flower = document.createElement('img');
//         flower.src = '/assets/flower.png';
//         flower.classList.add('flower');
//         flower.style.left = Math.random() * window.innerWidth + 'px';
//         document.body.appendChild(flower);

//         setTimeout(() => { flower.remove(); }, 3000);
//     }
// }