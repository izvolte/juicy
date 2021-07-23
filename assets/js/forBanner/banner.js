//
//   Variables
//
//////////////////////////////////////////////////////////////////////
let tickerSpeed = 0

// Play with this value to change the speed
if (document.documentElement.clientWidth > 700) {
    tickerSpeed = -1.5;
} else {
    tickerSpeed = -0.5;
}

let flickity = null;
let isPaused = false;
const slideshowEl = document.querySelector('.top-banner__ticker');


//
//   Functions
//
//////////////////////////////////////////////////////////////////////

const update = () => {
    if (isPaused) return;
    if (flickity.slides) {
        flickity.x = (flickity.x - tickerSpeed) % flickity.slideableWidth;
        flickity.selectedIndex = flickity.dragEndRestingSelect();
        flickity.updateSelectedSlide();
        flickity.settle(flickity.x);
    }
    window.requestAnimationFrame(update);
};

const pause = () => {
    isPaused = true;
};

const play = () => {
    if (isPaused) {
        isPaused = false;
        window.requestAnimationFrame(update);
    }
};


//
//   Create Flickity
//
//////////////////////////////////////////////////////////////////////

flickity = new Flickity(slideshowEl, {
    autoPlay: false,
    pageDots: false,
    draggable: false,
    wrapAround: true,
    selectedAttraction: 0.015,
    friction: 0.25,
    prevNextButtons: false
});
flickity.x = 0;


//
//   Add Event Listeners
//
//////////////////////////////////////////////////////////////////////

flickity.on('dragStart', () => {
    isPaused = true;
});


//
//   Start Ticker
//
//////////////////////////////////////////////////////////////////////

update();


document.addEventListener('click', ({target}) => {
    if (target.closest('.top-banner__close')) {
        target.closest('.top-banner').style.height = '0'
    }
})

jQuery(document).ready(() => {
    flickity.destroy()
    flickity = new Flickity(slideshowEl, {
        autoPlay: false,
        pageDots: false,
        draggable: false,
        wrapAround: true,
        selectedAttraction: 0.015,
        friction: 0.25,
        prevNextButtons: false
    })
})
