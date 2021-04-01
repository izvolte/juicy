
function onRem() {
    let width = document.documentElement.clientWidth;
    switch (true) {
        case (width > 1200):
            document.documentElement.style.fontSize = width / 1920 + 'px';
            break;
        case (width > 700):
            document.documentElement.style.fontSize = width / 1000 + 'px';
            break;
        case (width < 700):
            document.documentElement.style.fontSize = width / 320 + 'px';
            break;
    }
}


window.addEventListener('resize', onRem);

onRem();
