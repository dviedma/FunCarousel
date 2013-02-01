/*===== FunCarousel
Author: Daniel Viedma
Date: 04-25-2012
============================================================ */
(function($){
    var totalWidth,
  		slideWidth,
    	slideGutter,
    	shift,
    	numSlides,
		numSlidesPerScreen,
    	animating,
		parallaxForegroundPosition,
		t;

    var $controlnav;
    var $firstSlide;

    $.fn.funCarousel = function(ops) {
        var defaults = {
            controlNav: false,
            speed: 'fast',

            securityMargin: 0,
            //adjust this value to avoid empty spaces on sides depending on how many slides you have,
            //size of the shift and how wide is the slide

            numSlidesPerShift: 1,
            parallax: false,
			auto: false,
   			autoInterval: 5000
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
				$firstSlide = self.find('.slide').first().addClass('active');  //active = fist visible slide
				slideGutter = parseInt($firstSlide.css('margin-right'), 10);
				slideWidth = $firstSlide.width();
				shift = $firstSlide.width() + parseInt(slideGutter, 10);
				numSlides = self.find('.slide').size();
				totalWidth = (numSlides * 3) * (slideGutter + slideWidth);	//[copy#1 copy#2 ... copy#n] [#1 #2 ... #n] [copy#1 copy#2 ... copy#n]
				self.find('.slides').css('width',totalWidth);


				var visibleWidth = (self.css('position') == 'relative')? self.width() : $(window).width();
				numSlidesPerScreen = (visibleWidth + slideGutter) / (slideWidth + slideGutter);

                if(numSlides > numSlidesPerScreen){
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

                        var bulletWidth = parseInt($controlnav.find('.control').first().css('width')),
                        	bulletMargin = parseInt($controlnav.find('.control').first().css('margin-right'))*2,
                        	controlWidth = numSlides * (bulletWidth + bulletMargin),
							$control = $controlnav.find('.control');

                        $controlnav.find('.wrapper').width(controlWidth);
						$control.first().addClass('active');
						$control.each(function(){
                            $(this).click({self: self, shift: shift, numSlides: numSlides}, fc.navigateTo);
                        });
                    }

                    //Build arrows nav
                    var $arrowLeft = $('<span class="nav-arrow left">left</span>'),
                    	$arrowRight = $('<span class="nav-arrow right">right</span>');

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
                            slideNodes[i].removeClass('active');
                        }
                    }
                    for (var z=0; z<numCopies; z++) {
                        self.find('.slides').append( slideNodes[z].clone().attr('rel','omega') );
                    }
                    for (var j=numCopies-1; j>=0; j--) {
                        self.find('.slides').prepend( slideNodes[j].clone().attr('rel','alpha') );
                    }

					if(options.parallax) {
						parallaxForegroundPosition = self.find('.parallax-foreground').first().css('left');
					}

                    //auto rotation
                    if(options.auto) {
                        fc.slideAuto(self, shift, numSlides);
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
                var self = e.data.self,
                	shift = e.data.shift,
                	numSlides = e.data.numSlides,
					$slides = self.find('.slides');

                var $clickedBullet = $(this);

				if(e.type == "click"){
					clearTimeout(t);
				}

                if(Math.abs(self.find('.control-nav .active').index()-$clickedBullet.index()) > 1){
                    self.find('.slides').addClass('blur');
                }

                //place the bullet
                self.find('.control-nav .active').removeClass('active');
                $clickedBullet.addClass('active');

				$slides.animate({left:-shift* ($clickedBullet.index()+numSlides) },options.speed, function(){
					$slides.removeClass('blur');

                    //move .active class
                    self.find('.slide').removeClass('active');
                    self.find('.slide[rel="'+$clickedBullet.index()+'"]').addClass('active');

                    //auto rotation
                    if(options.auto) {
                        fc.slideAuto(self, shift, numSlides);
                    }
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
                var self = e.data.self,
                	shift = e.data.shift,
                	numSlides = e.data.numSlides,
					$slide = self.find('.slide'),
					$slides = self.find('.slides');

				if(e.type == "click"){
					clearTimeout(t);
				}

                if(animating){
                    return undefined;
                }
                animating = true;

                if(options.parallax) {
                    fc.getActiveSlide(self).find('.parallax-foreground').animate({left:'+='+shift}, options.speed*0.5);
                }

                //animate slider
				$slides.animate({left:'+='+shift*options.numSlidesPerShift},options.speed, function(){
                    animating = false;

                    //move bullet
                    fc.moveBulletLeft(self);

                    var indexActive = fc.getActiveSlide(self).index();
                    if(indexActive - 2*options.numSlidesPerShift - options.securityMargin < 0) {     //backCarouselToBeginning
                        fc.getActiveSlide(self).removeClass('active');
						$slide.eq(indexActive-options.numSlidesPerShift+numSlides).addClass('active');

                        //move carousel to end
						$slides.css('left', -shift*(indexActive-options.numSlidesPerShift+numSlides));
                    }else{                                                                          //keep moving left
                        fc.getActiveSlide(self).removeClass('active');
						$slide.eq(indexActive-options.numSlidesPerShift).addClass('active');
                    }

                    if(options.parallax) {
                        $('.parallax-foreground').css('left', parallaxForegroundPosition);
                    }

                   	//auto rotation
                    if(options.auto) {
                        fc.slideAuto(self, shift, numSlides);
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
                var self = e.data.self,
                	shift = e.data.shift,
                	numSlides = e.data.numSlides,
					$slide = self.find('.slide'),
					$slides = self.find('.slides');

				if(e.type == "click"){
					clearTimeout(t);
				}

                //animate slider
                if(animating){
                    return undefined;
                }
                animating = true;

                if(options.parallax) {
                    fc.getActiveSlide(self).find('.parallax-foreground').animate({left:'-='+shift}, options.speed*0.75);
                }

				$slides.animate({left:'-='+shift*options.numSlidesPerShift},{
                    duration:options.speed,
                    complete: function(){

						animating = false;
                        //move bullet
                        fc.moveBulletRight(self);

                        var indexActive = fc.getActiveSlide(self).index();
                        //if we still have slides on our right, move. otherwise insert the first node (circular navigation)
                        if(indexActive + (options.numSlidesPerShift-1) + 2*options.numSlidesPerShift + options.securityMargin > self.find('.slide').size()-1) {
                            fc.getActiveSlide(self).removeClass('active');
							$slide.eq(indexActive+options.numSlidesPerShift-numSlides).addClass('active');

                            //move carousel to beginning
							$slides.css('left',-shift*(indexActive+options.numSlidesPerShift-numSlides));
                        } else {                                                         //keep moving right
                            fc.getActiveSlide(self).removeClass('active');
							$slide.eq(indexActive+options.numSlidesPerShift).addClass('active');
                        }

                        if(options.parallax) {
                            $('.parallax-foreground').css('left', parallaxForegroundPosition);
                        }

						//auto rotation
						if(options.auto) {
							fc.slideAuto(self, shift, numSlides);
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
				var $controlActive = self.find('.control-nav .active'),
					$control = self.find('.control-nav .control');

                if($controlActive.next().size() > 0){
					$controlActive.removeClass('active').
                        next().
                        addClass('active');
                }
                else {
					$controlActive.removeClass('active');
					$control.eq(0).addClass('active');
                }
            },

            /**
             * Auxiliar function to get the .active slide (first visible slide)
             *
             * @method getActiveSlide
             * @return first/active/visible slide
             * @param self {HTMLElement} The element to create the carousel for.
             */
            getActiveSlide: function(self) {
                return self.find('.slide.active');
            },

			/**
			 * Auxiliar function to get fire the auto navigation
			 *
			 * @method slideAuto
			 * @return undefined
			 * @param self {HTMLElement} The element to create the carousel for.
			 */
			slideAuto: function(self, shift, numSlides) {
				var e = {
					data: {
						self: self,
						shift: shift,
						numSlides: numSlides
					}
				};
				t = setTimeout(function(){
					fc.navRight(e);
				}, options.autoInterval);
			}


        };

 		return this.each(function(){
			fc.build($(this));
		});

    };
}(jQuery));