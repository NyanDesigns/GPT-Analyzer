import bot from './assets/bot.svg'
import user from './assets/user.svg'

const promptFilePath = 'prompts.json';
const form = document.querySelector('form')
const subtitleElement = document.getElementById('subtitle');
const chatContainer = document.querySelector('#chat_container')
const buttons = document.querySelectorAll('#title-buttons button');

// Reply Loading Animation
let loadInterval

function loader(element) {
    element.textContent = ''

    loadInterval = setInterval(() => {
        // Update the text content of the loading indicator
        element.textContent += '.';

        // If the loading indicator has reached three dots, reset it
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

// Type Text Input
function typeText(element, text) {
    let index = 0

    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index)
            index++
        } else {
            clearInterval(interval)
        }
    }, 20)
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

// Create Chat Thread
function chatStripe(isAi, value, uniqueId) {
    return (
        `
        <div class="wrapper ${isAi && 'ai'}">
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? bot : user} 
                      alt="${isAi ? 'bot' : 'user'}" 
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `
    )
}

// Submit Button Function
const handleSubmit = async (e, promptString) => {
    e.preventDefault()

    const data = new FormData(form)

    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

    // to clear the textarea input 
    form.reset()

    // bot's chatstripe
    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

    // to focus scroll to the bottom 
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // specific message div 
    const messageDiv = document.getElementById(uniqueId)

    // messageDiv.innerHTML = "..."
    loader(messageDiv)

    const response = await fetch('http://localhost:5000/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
            prompt: promptString + data.get('prompt')
        })
    })

    clearInterval(loadInterval)
    messageDiv.innerHTML = " "

    if (response.ok) {
        const data = await response.json();
        const parsedData = data.bot.trim() // trims any trailing spaces/'\n' 

        typeText(messageDiv, parsedData)
    } else {
        const err = await response.text()

        messageDiv.innerHTML = "Something went wrong"
        alert(err)
    }
}

//subtitle
fetch("subtitles.json")
  .then(response => response.json())
  .then(subtitles => {
    buttons.forEach(buttons => {
      buttons.addEventListener("click", () => {
        // get the id of the clicked button
        const buttonId = buttons.id;

        // update the subtitle element with the corresponding subtitle
        subtitleElement.textContent = subtitles[buttonId];
      });
    });
  });

// Active Button
buttons.forEach(button => {
  button.addEventListener('click', async () => {

    buttons.forEach(otherButton => {
      otherButton.classList.remove('active');
    });

    // Make Active
    button.classList.add('active');

    // Declare
    const promptName = button.id;
    const response = await fetch(promptFilePath);
    const prompts = await response.json();
    const promptString = prompts[promptName];

    const activeButton = document.querySelector('#title-buttons button.active');
    if (activeButton) {
    console.log('The active button is:', activeButton.textContent);
    } else {
    console.log('No button is currently active.');
    }

    // Submit Button
    console.log(promptString)
    form.addEventListener('submit', handleSubmit)
    form.addEventListener('keyup', (e) => {
        if (e.keyCode === 13) {
            handleSubmit(e, promptString)
        }
    })

  });
});