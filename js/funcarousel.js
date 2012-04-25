/*===== FunCarousel
Author: Daniel Viedma
Date: 04-25-2012
============================================================ */
(function($){
    var totalWidth;
    var innerWidth;
    var slidesGutter;
    var shift;
    var numSlides;
    var animating;

    var $controlnav;
    var $firstSlide;
    var $slidesContainer;

    $.fn.funCarousel = function(ops) {

        var defaults = {
            controlNav: true
        };

        var options = $.extend({}, defaults, ops);

        //Methods object
        var fc = {

            /**
             * Creates a carousel for all matched elements.
             *
             * @example $('#mycarousel').funCarousel();
             * @before
             *         <div id="slider1" class="slider">
             *              <div class="slides-wrapper">
             *                  <div class="slides">
             *                      <div class="slide"></div>
             *                      <div class="slide"></div>
             *                  </div>
             *               </div>
             *         </div>
             * @result
             *         <div id="slider1" class="slider">
             *              <div class="slides-wrapper">
             *                  <div class="slides" style="width: totalWidth; left: -shift">
             *                      <div class="slide" rel="alpha"></div>
             *                      <div class="slide" rel="0"></div>
             *                      <div class="slide" rel="1"></div>
             *                      <div class="slide" rel="omega"></div>
             *                  </div>
             *               </div>
             *         </div>
             *
             * @method build
             * @return jQuery
             * @param self {HTMLElement} The element to create the carousel for.
             */
            build: function(self) {
                self.find('.slide').css('display','block');
                $firstSlide = self.find('.slide').first();
                $firstSlide.addClass('first');  //first = active slide
                slidesGutter = parseInt($firstSlide.css('margin-right'));
                innerWidth = self.find('.slides-wrapper').width();
                shift = innerWidth + parseInt(slidesGutter);
                numSlides = self.find('.slide').size();
                totalWidth = (numSlides + 2) * (slidesGutter + innerWidth);
                $slidesContainer = self.find('.slides');
                $slidesContainer.css('width',totalWidth);

                if(numSlides > 1){
                    //Add number to slides
                    self.find('.slide').each(function(index){
                        $(this).attr('rel', index);
                    });

                    //Build control nav
                    $controlnav = $('<div class="control-nav"><div class="wrapper"></div></div>');
                    self.find('.slide').each(function(){
                        $controlnav.children('.wrapper').append('<span class="control"></span>');
                    });
                    $controlnav.insertAfter($slidesContainer);

                    var bulletWidth = parseInt($controlnav.find('.control').first().css('width'));
                    var bulletMargin = parseInt($controlnav.find('.control').first().css('margin-right'))*2;
                    var controlWidth = numSlides * (bulletWidth + bulletMargin);

                    $controlnav.find('.wrapper').width(controlWidth);
                    $controlnav.find('.control').first().addClass('active');
                    $controlnav.find('.control').each(function(){
                        $(this).click({self: self}, fc.navigateTo);
                    });

                    //Build arrows nav
                    var $arrowLeft = $('<span class="nav-arrow left">left</span>');
                    var $arrowRight = $('<span class="nav-arrow right">right</span>');

                    $arrowLeft.click({self: self}, fc.navLeft);
                    $arrowRight.click({self: self}, fc.navRight);

                    self.append($arrowLeft).append($arrowRight);

                    //Build alpha and omega
                    $slidesContainer.css('left',-shift);

                    var firstNode = self.find('.slide').first();
                    var lastNode = self.find('.slide').last();
                    self.find('.slides').append( firstNode.clone().attr('rel','omega').removeClass('first') );
                    self.find('.slides').prepend( lastNode.clone().attr('rel','alpha') );
                }

                return self;
            },

            /**
             * Fired when the user clicks on the bullets at the bottom to move from slide to slide
             *
             * @method navigateTo
             * @return undefined
             * @param e {Event} User click event
             */
            navigateTo: function(e) {
                var self = e.data.self;
                var $clickedBullet = $(this);

                if(Math.abs(self.find('.control-nav .active').index()-$clickedBullet.index()) > 1){
                    $slidesContainer.addClass('blur');
                }

                //place the bullet
                self.find('.control-nav .active').removeClass('active');
                $clickedBullet.addClass('active');

                $slidesContainer.animate({left:-shift* ($clickedBullet.index()+1) },'fast', function(){
                    $slidesContainer.removeClass('blur');

                    //move .first class
                    self.find('.slide').removeClass('first');
                    self.find('.slide[rel="'+$clickedBullet.index()+'"]').addClass('first');
                });
            },

            /**
             * Fired when the user clicks on the left navigation
             *
             * @method navLeft
             * @return undefined
             * @param e {Event} User click event
             */
            navLeft: function(e) {
                var self = e.data.self;

                if(animating){
                    return undefined;
                }
                animating = true;

                //animate slider
                $slidesContainer.animate({left:'+='+shift},'fast', function(){
                    animating = false;

                    //move bullet
                    fc.moveBulletLeft(self);

                    //if we still have slides on our left, move. otherwise insert the last node (circular navigation)
                    if(fc.getFirstSlide(self).prev().attr('rel') == "alpha"){     //backCarruouselToBeginning
                        fc.getFirstSlide(self).removeClass('first');
                        var slides = self.find('.slide');
                        slides.eq( slides.size()-2 ).addClass('first');

                        //move carousel to end
                        $slidesContainer.css('left', (numSlides)*-shift);
                    }else{                                                      //keep moving left
                        //shift .first class
                        fc.getFirstSlide(self).removeClass('first').
                            prev().
                            addClass('first');
                    }

                });
            },

            /**
             * Moves bullet to the left after animating the carousel on user left navigation
             *
             * @method moveBulletLeft
             * @return undefined
             * @param self {HTMLElement} The element to create the carousel for.
             */
            moveBulletLeft: function(self) {
                if(self.find('.control-nav .active').prev().size() > 0){
                    self.find('.control-nav .active').removeClass('active').
                        prev().
                        addClass('active');
                }
                else {
                    self.find('.control-nav .active').removeClass('active');
                    var bullets = self.find('.control-nav .control');
                    bullets.eq(bullets.size()-1).addClass('active');
                }
            },

            /**
             * Fired when the user clicks on the right navigation
             *
             * @method navRight
             * @return undefined
             * @param e {Event} User click event
             */
            navRight: function (e){
                var self = e.data.self;

                //animate slider
                if(animating){
                    return undefined;
                }
                animating = true;
                $slidesContainer.animate({left:'-='+shift},{
                    duration:'fast',
                    complete: function(){
                        animating = false;
                        //move bullet
                        fc.moveBulletRight(self);

                        //if we still have slides on our right, move. otherwise insert the first node (circular navigation)
                        if(fc.getFirstSlide(self).next().attr('rel') == "omega") {         //backCarruouselToBeginning
                            fc.getFirstSlide(self).removeClass('first');
                            self.find('.slide[rel="0"]').addClass('first');

                            //move carousel to beginning
                            $slidesContainer.css('left', -shift);
                        } else {                                                         //keep moving right
                            //shift .first class
                            fc.getFirstSlide(self).removeClass('first').
                                next().
                                addClass('first');
                        }
                    }

                });
            },

            /**
             * Moves bullet to the right after animating the carousel on user right navigation
             *
             * @method moveBulletLeft
             * @return undefined
             * @param self {HTMLElement} The element to create the carousel for.
             */
            moveBulletRight: function(self) {
                if(self.find('.control-nav .active').next().size() > 0){
                    self.find('.control-nav .active').removeClass('active').
                        next().
                        addClass('active');
                }
                else {
                    self.find('.control-nav .active').removeClass('active');
                    self.find('.control-nav .control').eq(0).addClass('active');
                }
            },

            /**
             * Auxiliar function to get the first/active/visible slide
             *
             * @method getFirstSlide
             * @return first/active/visible slide
             * @param self {HTMLElement} The element to create the carousel for.
             */
            getFirstSlide: function(self) {
                return self.find('.slide.first');
            }

        };


        if(this.length){
            return fc.build(this);
        }

    };
}(jQuery));