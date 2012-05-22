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

    $.fn.funCarousel = function(ops) {

        var defaults = {
            controlNav: false,
            speed: 'fast',
            securityMargin: 0,
            numSlidesPerShift: 1,
            parallax: false
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
                $firstSlide.addClass('first active');  //first = active slide
                slidesGutter = parseInt($firstSlide.css('margin-right'));
                innerWidth = self.find('.slides-wrapper').parent().width();
                //self.find('.slides-wrapper').css('width', innerWidth);
                //self.find('.slides-wrapper .slide').css('width', innerWidth);
                shift = $firstSlide.width() + parseInt(slidesGutter);
                numSlides = self.find('.slide').size();
                totalWidth = (numSlides * 3) * (slidesGutter + innerWidth);
                self.find('.slides').css('width',totalWidth);

                if(numSlides > 1){
                    //Add number to slides
                    self.find('.slide').each(function(index){
                        $(this).attr('rel', index);
                    });

                    //Build control nav
                    if(options.controlNav) {
                        $controlnav = $('<div class="control-nav"><div class="wrapper"></div></div>');
                        self.find('.slide').each(function(){
                            $controlnav.children('.wrapper').append('<span class="control"></span>');
                        });
                        $controlnav.insertAfter(self.find('.slides'));

                        var bulletWidth = parseInt($controlnav.find('.control').first().css('width'));
                        var bulletMargin = parseInt($controlnav.find('.control').first().css('margin-right'))*2;
                        var controlWidth = numSlides * (bulletWidth + bulletMargin);

                        $controlnav.find('.wrapper').width(controlWidth);
                        $controlnav.find('.control').first().addClass('active');
                        $controlnav.find('.control').each(function(){
                            $(this).click({self: self, shift: shift, numSlides: numSlides}, fc.navigateTo);
                        });
                    }

                    //Build arrows nav
                    var $arrowLeft = $('<span class="nav-arrow left">left</span>');
                    var $arrowRight = $('<span class="nav-arrow right">right</span>');

                    $arrowLeft.click({self: self, shift: shift, numSlides: numSlides}, fc.navLeft);
                    $arrowRight.click({self: self, shift: shift, numSlides: numSlides}, fc.navRight);

                    self.append($arrowLeft).append($arrowRight);

                    //Build alpha and omega: we clone as many slidesPerScreen as we have and insert them before and after the original slides
                    var numCopies = numSlides;
                    self.find('.slides').css('left',-shift*numCopies);

                    var slideNodes = [];
                    for (var i=0; i<numCopies; i++) {
                        slideNodes[i] = self.find('.slide').eq(i).clone().attr('rel','');
                        if (i==0) {
                            slideNodes[i].removeClass('first active');
                        }
                    }
                    for (var z=0; z<numCopies; z++) {
                        self.find('.slides').append( slideNodes[z].clone().attr('rel','omega') );
                    }
                    for (var j=numCopies-1; j>=0; j--) {
                        self.find('.slides').prepend( slideNodes[j].clone().attr('rel','alpha') );
                    }
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
                var shift = e.data.shift;
                var numSlides = e.data.numSlides;

                var $clickedBullet = $(this);

                if(Math.abs(self.find('.control-nav .active').index()-$clickedBullet.index()) > 1){
                    self.find('.slides').addClass('blur');
                }

                //place the bullet
                self.find('.control-nav .active').removeClass('active');
                $clickedBullet.addClass('active');

                self.find('.slides').animate({left:-shift* ($clickedBullet.index()+numSlides) },options.speed, function(){
                    self.find('.slides').removeClass('blur');

                    //move .first class
                    self.find('.slide').removeClass('first active');
                    self.find('.slide[rel="'+$clickedBullet.index()+'"]').addClass('first active');
                });
            },

            /**
             * Fired when the user clicks on the left navigation
             * * NOTES: the formulas applied for threshold detection etc. should be tested in different scenarios (number of slides, slides per shift, slides per screen, etc)
             *
             * @method navLeft
             * @return undefined
             * @param e {Event} User click event
             */
            navLeft: function(e) {
                var self = e.data.self;
                var shift = e.data.shift;
                var numSlides = e.data.numSlides;

                if(animating){
                    return undefined;
                }
                animating = true;

                if(options.parallax) {
                    fc.getFirstSlide(self).find('.box').animate({left:'+='+shift},800);
                }

                //animate slider
                self.find('.slides').animate({left:'+='+shift*options.numSlidesPerShift},options.speed, function(){
                    animating = false;

                    //move bullet
                    fc.moveBulletLeft(self);

                    var indexFirst = fc.getFirstSlide(self).index();
                    var indexActive = fc.getActiveSlide(self).index();
                    if(indexFirst - 2*options.numSlidesPerShift - options.securityMargin < 0) {     //backCarouselToBeginning
                        fc.getFirstSlide(self).removeClass('first');
                        fc.getActiveSlide(self).removeClass('active');
                        self.find('.slide').eq(indexActive-options.numSlidesPerShift+numSlides).addClass('first active');

                        //move carousel to end
                        self.find('.slides').css('left', -shift*(indexActive-options.numSlidesPerShift+numSlides));
                    }else{                                                                          //keep moving left
                        //shift .first class
                        fc.getFirstSlide(self).removeClass('first active').
                            prev().
                            addClass('first');

                        self.find('.slide').eq(indexFirst-options.numSlidesPerShift).addClass('active');
                    }

                    if(options.parallax) {
                        $('.box').css('left', '450px');
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
             * NOTES: the formulas applied for threshold detection etc. should be tested in different scenarios (number of slides, slides per shift, slides per screen, etc)
             *
             * @method navRight
             * @return undefined
             * @param e {Event} User click event
             */
            navRight: function (e){
                var self = e.data.self;
                var shift = e.data.shift;
                var numSlides = e.data.numSlides;

                //animate slider
                if(animating){
                    return undefined;
                }
                animating = true;

                if(options.parallax) {
                    fc.getFirstSlide(self).find('.box').animate({left:'-='+shift},800);
                }

                self.find('.slides').animate({left:'-='+shift*options.numSlidesPerShift},{
                    duration:options.speed,
                    complete: function(){
                        animating = false;
                        //move bullet
                        fc.moveBulletRight(self);

                        var indexFirst = fc.getFirstSlide(self).index();
                        var indexActive = fc.getActiveSlide(self).index();
                        //if we still have slides on our right, move. otherwise insert the first node (circular navigation)
                        if(indexFirst + (options.numSlidesPerShift-1) + 2*options.numSlidesPerShift + options.securityMargin > self.find('.slide').size()-1) {
                            fc.getFirstSlide(self).removeClass('first');
                            fc.getActiveSlide(self).removeClass('active');
                            self.find('.slide').eq(indexActive+options.numSlidesPerShift-numSlides).addClass('first active');

                            //move carousel to beginning
                            self.find('.slides').css('left',-shift*(indexActive+options.numSlidesPerShift-numSlides));
                        } else {                                                         //keep moving right
                            //shift .first class
                            fc.getFirstSlide(self).removeClass('first active').
                                next().
                                addClass('first');

                            self.find('.slide').eq(indexFirst+options.numSlidesPerShift).addClass('active');
                        }

                        if(options.parallax) {
                            $('.box').css('left', '450px');
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
             * Auxiliar function to get the .first slide THRESHOLD detection purpose
             *
             * @method getFirstSlide
             * @return first/active/visible slide
             * @param self {HTMLElement} The element to create the carousel for.
             */
            getFirstSlide: function(self) {
                return self.find('.slide.first');
            },

            /**
             * Auxiliar function to get the .active slide (first visible slide)
             *
             * @method getFirstSlide
             * @return first/active/visible slide
             * @param self {HTMLElement} The element to create the carousel for.
             */
            getActiveSlide: function(self) {
                return self.find('.slide.active');
            }

        };


        if(this.length){
            return fc.build(this);
        }

    };
}(jQuery));