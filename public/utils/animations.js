(function($) {
    "use strict";

    $('.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: ($($anchor.attr('href')).offset().top - 50)
        }, 1250, 'easeInOutExpo');
        event.preventDefault();
    });

    $('body').scrollspy({
        target: '#homeNav',
        offset: 51
    });

    $('#homeNav').affix({
        offset: {
            top: 100
        }
    });

})(jQuery);
