
async function navigateTo(page){
	const header = document.querySelector("header")
    console.log(`Navigating to: ${page}`);
	document.querySelector("#body").innerHTML = "";
    switch (page) {
        case 'entry':
            await loadComponent('entry_form');
            header.style.display = "none";
            break;
        case 'home':
            await loadComponent('home');
            break;
        case 'org':
            await loadComponent("organization_settings");
            break;
        case 'giveaway':
            await loadComponent("giveaway_drawing");
            break;
        default:
            await loadPage('404');
    }
}

async function loadComponent(comp) {
    try {
        const response = await fetch(`./comp/${comp}.html`);
        if (!response.ok) throw new Error(`Failed to load ${comp}.html`);
        const html = await response.text();
        document.querySelector("#body").innerHTML += html;
        // Extract and run script tags
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');


        doc.querySelectorAll('script').forEach(script => {
            const newScript = document.createElement('script');
            newScript.text = script.textContent;
            document.body.appendChild(newScript);
        });

    } catch (error) {
        console.error(error);
        document.body.innerHTML = `<p>Error loading ${comp} page.</p>`;
    }
}

async function loadPresetFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const presetName = urlParams.get('preset');
    if (!presetName) return;

    try {
        messageBus.emit('loadPreset', data);
        loadComponent(presetName);
        console.log(`Preset "${presetName}" loaded.`);
    } catch (err) {
        console.error('Failed to load preset:', err);
    }
}

// Call this once when the page/component loads
loadPresetFromURL();


// messageBus.js
// A simple pub/sub system with sticky events so late listeners get the last event
let messageBus = {
    listeners: {},
    on: function(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        console.log("created callback "+event)
    },
    off: function(event) {
        if (this.listeners[event]) {
            delete this.listeners[event]
        }
        console.log("removed callback "+event)
    },
    emit: function(event, data) {
        //console.log("emitting "+event+" with data "+JSON.stringify(data))
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}



function waitForReady(events, callback) {
    const state = {};
    events.forEach(event => {
        messageBus.on(event, () => {
			console.log(`Component ready: ${event}`);
            state[event] = true;
            if (events.every(e => state[e])) {
                callback();
            }
        });
    });
}

function startTimer(seconds, callback){
    setTimeout(callback, seconds*1000);
}
