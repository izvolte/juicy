function fadeIn(elem, speed = 250) {
    elem.classList.add('ch-opacity');
    setTimeout(() => {
        elem.classList.add('ch-hidden');
    }, speed);
}

function fadeOut(elem) {
    elem.classList.remove('ch-hidden');
    setTimeout(() => {
        elem.classList.remove('ch-opacity');
    }, 0);
}

function startSlider() {

    jQuery('.ch-start-slider').slick({
        dots: true,
        infinite: true,
        // autoplay: true,
        // autoplaySpeed: 3500,
    });
}

function wordDecline(num, expressions) {
    let result;
    let count = num % 100;
    if (count >= 5 && count <= 20) {
        result = expressions['2'];
    } else {
        count = count % 10;
        if (count == 1) {
            result = expressions['0'];
        } else if (count >= 2 && count <= 4) {
            result = expressions['1'];
        } else {
            result = expressions['2'];
        }
    }
    return result;
}


function formValidation() {
    document.addEventListener('click', e => {
        let target = e.target;
        if (target.classList.contains('ch-form__submit')) {
            e.preventDefault();


            const form = target.closest('.ch-form');
            const arrInputs = form.querySelectorAll('[name]');

            let errors = false;

            arrInputs.forEach(elem => {
                if (elem.hasAttribute('data-required')) {
                    const wrapper = elem.closest('div');
                    const name = elem.getAttribute('data-required');
                    let value = elem.value;
                    switch (name) {
                        case 'tel':
                            if (value.length < 18) {
                                errors = true;
                                wrapper.classList.add('not-valid');
                            } else {
                                wrapper.classList.remove('not-valid');
                                wrapper.classList.add('valid');
                            }
                            break;

                        case 'name':
                            if (value.length < 2) {
                                errors = true;
                                wrapper.classList.add('not-valid');
                            } else {
                                wrapper.classList.remove('not-valid');
                                wrapper.classList.add('valid');
                            }
                            break;

                        case 'email':
                            if (!validateEmail(value)) {
                                errors = true;
                                wrapper.classList.add('not-valid');
                            } else {
                                wrapper.classList.remove('not-valid');
                                wrapper.classList.add('valid');
                            }
                            break;

                        case 'message':
                            if (value.length < 5) {
                                errors = true;
                                wrapper.classList.add('not-valid');
                            } else {
                                wrapper.classList.remove('not-valid');
                                wrapper.classList.add('valid');
                            }
                            break;

                        case 'password':
                            if (value.length < 5) {
                                errors = true;
                                wrapper.classList.add('not-valid');
                            } else {
                                wrapper.classList.remove('not-valid');
                                wrapper.classList.add('valid');
                            }
                            break;

                        case 'password-repeat':
                            const pass = form.querySelector('[data-required="password"]');
                            const passWrapper = pass.closest('div');
                            if (value !== pass.value || value.length < 5) {
                                errors = true;
                                wrapper.classList.remove('valid');
                                wrapper.classList.add('not-valid');
                                passWrapper.classList.remove('valid');
                                passWrapper.classList.add('not-valid');
                            } else {
                                wrapper.classList.remove('not-valid');
                                wrapper.classList.add('valid');
                            }
                            break;


                        case 'date':
                            if (value.length !== 10) {
                                errors = true;
                                wrapper.classList.add('not-valid');
                            } else {
                                wrapper.classList.remove('not-valid');
                                wrapper.classList.add('valid');
                            }
                            break;

                        default:

                            if (value.length === 0) {
                                errors = true;
                                wrapper.classList.add('not-valid');
                            } else {
                                wrapper.classList.remove('not-valid');
                                wrapper.classList.add('valid');
                            }
                    }
                }
            });

            if (!errors) {
                form.submit();
            }

        }
    });


    document.addEventListener('keydown', e => {
        let target = e.target;
        if (target.hasAttribute('name')) {
            const wrapper = target.closest('div');
            wrapper.classList.remove('not-valid');
            wrapper.classList.remove('valid');
        }
    });

    document.addEventListener('click', e => {
        let target = e.target;
        if (target.classList.contains('ch-select__option')) {
            const wrapper = target.closest('.ch-select');
            wrapper.classList.remove('not-valid');
            wrapper.classList.remove('valid');
        }

        if (target.classList.contains('ch-input_date')) {
            const wrapper = target.closest('div');
            wrapper.classList.remove('not-valid');
            wrapper.classList.remove('valid');
        }
    });
};


function maskTel() {
    let keyCode;

    function mask(event) {
        event.keyCode && (keyCode = event.keyCode);
        let pos = this.selectionStart;
        if (pos < 3) event.preventDefault();
        let matrix = "+7 (___) ___-__-__",
            i = 0,
            def = matrix.replace(/\D/g, ""),
            val = this.value.replace(/\D/g, ""),
            new_value = matrix.replace(/[_\d]/g, function (a) {
                return i < val.length ? val.charAt(i++) || def.charAt(i) : a
            });
        i = new_value.indexOf("_");
        if (i !== -1) {
            i < 5 && (i = 3);
            new_value = new_value.slice(0, i)
        }
        let reg = matrix.substr(0, this.value.length).replace(/_+/g,
            function (a) {
                return "\\d{1," + a.length + "}"
            }).replace(/[+()]/g, "\\$&");
        reg = new RegExp("^" + reg + "$");
        if (!reg.test(this.value) || this.value.length < 5 || keyCode > 47 && keyCode < 58) this.value = new_value;
        if (event.type === "blur" && this.value.length < 5) this.value = ""
    }

    let input = document.querySelectorAll('.ch-mask-tel');
    input.forEach(elem => {
        elem.addEventListener("input", mask, false);
        elem.addEventListener("focus", mask, false);
        elem.addEventListener("blur", mask, false);
        elem.addEventListener("keydown", mask, false);
    });
}


function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function burgerLogic() {
    document.addEventListener('click', e => {
        let target = e.target;
        if (target.closest('.ch-burger')) {
            let burger = target.closest('.ch-burger');
            let header = burger.closest('.ch-header');
            if (header.classList.contains('open')) {
                closeBurger();
            } else {
                openBurger();
            }
        }
        if (target.closest('.ch-header-nav__item')) {
            closeBurger();
        }
    })
}

function closeBurger() {
    const header = document.querySelector('.ch-header');
    header.classList.remove('open');
}

function openBurger() {
    const header = document.querySelector('.ch-header');
    header.classList.add('open');

}


function openOrder() {
    document.addEventListener('click', e => {
        let target = e.target;
        if (target.classList.contains('ch-list-orders-item__more')) {
            const order = target.closest('.ch-list-orders-item');
            const wrapper = order.querySelector('.ch-list-orders-item__wrapper');
            const list = order.querySelector('.ch-list-orders-item__cont');
            order.classList.toggle('open');
            if (order.classList.contains('open')) {
                wrapper.style.height = list.clientHeight + 'px';
            } else {
                wrapper.style.height = '';
            }
        }
    })
}

function dropDown() {
    document.addEventListener('click', e => {
        let target = e.target;
        if (target.classList.contains('ch-drop-down__header')) {
            const elem = target.closest('.ch-drop-down');
            const wrapper = elem.querySelector('.ch-drop-down__cont');
            const list = elem.querySelector('.ch-drop-down__list');
            elem.classList.toggle('open');
            if (elem.classList.contains('open')) {
                wrapper.style.height = list.clientHeight + 'px';
            } else {
                wrapper.style.height = '';
            }
        }
        if (!target.closest('.ch-drop-down')) {
            const arrDd = document.querySelectorAll('.ch-drop-down');
            arrDd.forEach(elem => {
                elem.classList.remove('open');
                elem.querySelector('.ch-drop-down__cont').style.height = '';
            })
        }
    })
}

function selectInput() {
    document.addEventListener('click', e => {
        let target = e.target;
        if (target.closest('.ch-select')) {
            let elem = target.closest('.ch-select');
            elem.classList.contains('open') ? closeSelect() : openSelect(target);
            if (target.closest('.ch-select__option')) {
                chooseSelect(target);
                closeSelect();
            }
        } else {
            closeSelect();
        }

        function openSelect(target) {
            const elem = target.closest('.ch-select');
            const wrapper = elem.querySelector('.ch-select__cont');
            const list = elem.querySelector('.ch-select__list');
            elem.classList.add('open');
            wrapper.style.height = list.clientHeight + 'px';
            if (wrapper.clientHeight < list.clientHeight) customScroll();
        }

        function closeSelect() {
            const arrDd = document.querySelectorAll('.ch-select');
            arrDd.forEach(elem => {
                elem.classList.remove('open');
                elem.querySelector('.ch-select__cont').style.height = '';
            })
        }

        function chooseSelect(target) {
            const elem = target.closest('.ch-select');
            const input = elem.querySelector('.ch-select__input');
            let prevActive = elem.querySelector('.ch-select__option.active');
            if (prevActive) prevActive.classList.remove('active');
            target.classList.add("active");
            let value = target.innerText;
            if (input.tagName === 'INPUT') {
                input.value = value;
            } else {
                input.innerText = value;
            }
        }
    })
}

function customScroll() {
    if (document.documentElement.clientWidth > 1200) {
        baron($('.ch-select__cont'), {
            scroller: '.ch-select__scroller',
            container: '.ch-select__list',
            bar: '.scroller__bar'
        });
    }
}

function closeModalButton() {
    document.addEventListener('click', e => {
        let target = e.target;
        if (target.getAttribute('data-modal') === 'close') {
            fadeIn(target.closest('.ch-modal'));
        }
    })
}

function changeValueButtons() {
    document.addEventListener('click', e => {
        let target = e.target;
        if (target.classList.contains('ch-value-control__button')) {
            const elem = target.closest('.ch-value-control');
            const elemNum = elem.querySelector('.ch-value-control__num');
            const plus = elem.querySelector('.ch-value-control__button_plus') || elem.querySelector('.ch-value-control__plus');
            const minus = elem.querySelector('.ch-value-control__button_minus') || elem.querySelector('.ch-value-control__minus');
            const word = elem.querySelector('.ch-value-control__word');
            let num = +elemNum.value;


            function numUp() {
                elemNum.value = ++num;
            }

            function numDown() {
                elemNum.value = --num;
            }

            if (target === plus) {
                numUp();
            }

            if (target === minus) {
                if (num !== 1) numDown();
            }

            if (word) changeWord(num);

            function changeWord(num) {
                word.innerText = num + ' ' + wordDecline(num, ['день', 'дня', 'дней']);
            }
        }
    })
}

function createSliderPartners() {

    $('.ch-partners__list').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        responsive: [
            {
                breakpoint: 9999,
                settings: "unslick"
            },
            {
                breakpoint: 700,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    infinite: true,
                    dots: false
                }
            }
        ]
    });

}

function createSliderRation() {
    let slickLive = false;

    function checkAndSlick() {
        let width = document.documentElement.clientWidth;
        if (width < 683) {
            if (!slickLive) {
                $('.ch-menu-week__day-list').slick({
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    infinite: true,
                    dots: false
                });
                slickLive = true;
            }
        } else {
            if (slickLive) {
                $('.ch-menu-week__day-list').slick('unslick');
                slickLive = false;

            }
        }
    }

    checkAndSlick();

    window.addEventListener('resize', checkAndSlick);
}

function openModal() {
    document.addEventListener('click', e => {
        let target = e.target;
        if (target.closest('[data-modal]')) {
            let atb = target.closest('[data-modal]').getAttribute('data-modal');
            if (atb !== 'close') {
                e.preventDefault();
                fadeOut(document.querySelector(`#${atb}`));
            }
        }
    })
}


function initDatePicker() {
    var currentDate = new Date();
    if(currentDate.getHours() >= 12){
        currentDate.setDate(currentDate.getDate() + 2);
    } else {
        currentDate.setDate(currentDate.getDate() + 1);
    }

    if (document.querySelector('[data-datepicker]')) {
        $('[data-datepicker]').datepicker({
            minDate: currentDate,
            onRenderCell: function (date, cellType) {
                if (cellType == 'day' && date.getDate() == 31 && date.getMonth() == 11) {
                    return {
                        classes: '-disabled-',
                    }
                }

                if (cellType == 'day' && (date.getDate() == 1 || date.getDate() == 2 || date.getDate() == 3) && date.getMonth() == 0) {
                    return {
                        classes: '-disabled-',
                    }
                }
            }
        });
    }
    
    if (document.querySelector('[birth-datepicker]')) {
        $('[birth-datepicker]').datepicker({
            onRenderCell: function (date, cellType) {
                if (cellType == 'day' && date.getDate() == 31 && date.getMonth() == 11) {
                    return {
                        classes: '-disabled-',
                    }
                }

                if (cellType == 'day' && (date.getDate() == 1 || date.getDate() == 2 || date.getDate() == 3) && date.getMonth() == 0) {
                    return {
                        classes: '-disabled-',
                    }
                }
            }
        });
    }
}


function formEditLk() {
    document.addEventListener('click', e => {
        let target = e.target;
        if (target.classList.contains('ch-edit-form')) {
            let item = target.closest('.ch-personal-data__item');
            let form = item.querySelector('.ch-form');
            let editor = item.querySelector('.ch-personal-data__editor');
            form.classList.remove('ch-hidden');
            editor.classList.add('ch-hidden');
        }
        if (target.classList.contains('ch-cancel')) {
            let item = target.closest('.ch-personal-data__item');
            let form = item.querySelector('.ch-form');
            let editor = item.querySelector('.ch-personal-data__editor');
            form.classList.add('ch-hidden');
            editor.classList.remove('ch-hidden');
        }
    })
}

function productDiet() {
    let elemWeek = document.querySelector('.ch-menu-week');
    if (elemWeek) {
        const wrapper = elemWeek.querySelector('.ch-menu-week__wrapper-days');

        function editHeight() {
            const day = elemWeek.querySelector('[name="day-input"]:checked').id;
            const dayDiet = elemWeek.querySelector(`.ch-menu-week__day-list[data-day="${day}"]`);
            wrapper.style.height = dayDiet.clientHeight + "px";
        }

        editHeight();

        document.addEventListener('click', editHeight);
    }
}


function saveDataCheck(){
    let saveDataCheckBox = document.getElementById('save_data_checkbox');
    let passInputs = document.querySelectorAll('.ch-input-invisible');
    
    saveDataCheckBox.addEventListener('input', () => {
       if(saveDataCheckBox.checked){
           passInputs.forEach(input => {
               input.classList.remove('ch-input-invisible');
           })
           passInputs[0].children[0].setAttribute("data-required", "password");
           passInputs[1].children[0].setAttribute("data-required", "password-repeat");
       }else{
          passInputs.forEach(input => {
               input.classList.add('ch-input-invisible');
           })
           passInputs[0].children[0].removeAttribute("data-required", "password");
           passInputs[1].children[0].removeAttribute("data-required", "password-repeat");
       }
    });
}

function dateMask(){
   
    let inputDate = document.querySelectorAll('.ch-mask_date');
    
    let dateMask = IMask(inputDate[0], {
         mask: Date,  // enable date mask
        pattern: 'd{.}`m{.}`Y',
      blocks: {
        d: {
          mask: IMask.MaskedRange,
          from: 1,
          to: 31,
          maxLength: 2,
        },
        m: {
          mask: IMask.MaskedRange,
          from: 1,
          to: 12,
          maxLength: 2,
        },
        Y: {
          mask: IMask.MaskedRange,
          from: 19000,
          to: 99999,
        }
      },
      // define date -> str convertion
      format: function (date) {
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();

        if (day < 10) day = "0" + day;
        if (month < 10) month = "0" + month;

        return [year, month, day].join('-');
      },
      // define str -> date convertion
      parse: function (str) {
        var yearMonthDay = str.split('-');
        return new Date(yearMonthDay[0], yearMonthDay[1] - 1, yearMonthDay[2]);
      },

      // optional interval options
      min: new Date(2000, 0, 1),  // defaults to `1900-01-01`
      max: new Date(2020, 0, 1),  // defaults to `9999-01-01`

      autofix: true,  // defaults to `false`

    });  
    
    inputDate.forEach(elem => {
        elem.addEventListener("blur", () => {
            if(elem.value.length<10)
            elem.value = "";
            dateMask.updateValue();
        });
    });
}

window.onload = function () {
    startSlider();

    formValidation();

    maskTel();

    burgerLogic();

    openOrder();

    dropDown();

    selectInput();

    closeModalButton();

    changeValueButtons();

    createSliderPartners();

    createSliderRation();

    openModal();

    initDatePicker();

    formEditLk();

    productDiet();
    
    //saveDataCheck();
    
    //dateMask();
};