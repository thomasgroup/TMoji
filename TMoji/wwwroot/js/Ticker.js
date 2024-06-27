var render = false;


self.onmessage = async function (event) {
    var data = event.data;

    switch (data.type) {
        case "start":
            console.log("start Tick")
            render = true;
            Tick();
            break;
        case "stop":
            render = false;
            break;

    }
}

async function Tick() {
    const inverval = setInterval(i => {
        console.log("onTick");
        self.postMessage({ event: "onTick", status: render });
    }, 10);

    //while (render) {
    //    console.log("onTick");
    //    self.postMessage({ event: "onTick", status: render });
    //    await Wait(200);
    //}

    //self.postMessage({event: "onTickEnd", status: render})
}

function Wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}