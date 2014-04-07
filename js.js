// reviews pagination

(function ($) {
    'use strict';

    var section, list, items, orderedItems, scores, pagesContainer, orderContainer,
        lastActive, perPage, sortByScore = false;

    perPage = 5;

    function init() {
        var pages;

        section = $('.reviews');
        list = section.find('.reviews_list');
        items = list.find('.one_review');

        scores = $.map(gatherScores(items), function (score, idx) {
            return {
                idx: idx,
                score: score
            };
        });

        scores = scores.sort(function (a, b) {
            if (a.score < b.score) return -1;
            if (a.score > b.score) return 1;
            return 0;
        }).reverse();

        // remove items from DOM
        items.remove();
        orderedItems = getSorted(items, scores);

        pages = preparePages(computePages(items));
        pagesContainer = pages.clone().addClass('reviews_pages_top');
        bindClickPages(pagesContainer);
        section.append(pagesContainer);

        orderContainer = prepareOrderingContainer();
        section.find('h2:first').append(orderContainer);
        bindOrderingOptions(orderContainer.find('.reviews_order_item'));

        setActiveOrdering(sortByScore);
    }

    function getSorted(arr, sortArr) {
        var result = [], i, l;

        for(i = 0, l = arr.length; i < l; i++) {
            result[i] = arr[sortArr[i].idx];
        }

        return result;
    }

    function gatherScores(items) {

        function valOf(selector) {
            return function (idx, el) {
                return parseInt($(el).find(selector).text(), 10);
            }
        }

        return $(items).map(valOf('.review_score'));
    }

    function preparePages(pages) {
        var list, item;

        list = $('<ul class="reviews_pages">');
        item = $('<li class="reviews_page btn">');
        
        while(pages--) {
            item.clone()
                .attr('data-page', pages + 1)
                .text(pages + 1)
                .prependTo(list);
        }

        return list;
    }

    function computePages(items) {
        return Math.ceil(items.length / perPage);
    }

    function bindClickPages(list) {
        list.find('.reviews_page').on('click', setActivePage);
    }

    function clearActivePage() {
        if (!lastActive) return;
        lastActive.removeClass('active');
    }

    function highlightActivePage(el) {
        clearActivePage();
        el.addClass('active');

        // save ref to lastActive for less traversing
        lastActive = el;
    }

    function showReviewsPage(page) {
        if (typeof page !== 'number') throw new TypeError('Page should be number');
        var partialReview, reviewsToShow, startIdx;

        startIdx = (page - 1) * perPage;
        reviewsToShow = sortByScore ? orderedItems : items;
        partialReview = reviewsToShow.slice(startIdx, startIdx + perPage);

        list.empty().append(partialReview);
    }

    function setActivePage(evt) {
        var idx, el;

        if (typeof evt === 'number') {
            idx = evt;
            el = pagesContainer.find('[data-page="' + idx + '"]');
        } else {
            el = $(evt.target);
            idx = el.attr('data-page');
        }

        highlightActivePage(el);
        showReviewsPage(parseInt(idx, 10));
    }

    function prepareOrderingContainer() {
        var list, itemTpl, items, ordered, notOrdered;

        list = $('<ul class="reviews_order"/>');
        itemTpl = $('<div class="reviews_order_item btn btn-small"></div>');

        ordered = itemTpl
            .clone()
            .text('Top reviews')
            .attr('data-toporder', true);

        notOrdered = itemTpl
            .clone()
            .text('Recent reviews')
            .attr('data-toporder', false);

        items = [ordered, notOrdered];
        list.append(items);

        return list;
    }

    function bindOrderingOptions(opts) {
        opts.on('click', setActiveOrdering);
    }

    function setActiveOrdering(e) {
        var el, val;

        if (typeof e === 'boolean') {
            el = orderContainer.find('[data-toporder=' + e + ']');
            val = e;
        } else {
            el = $(e.target);
            val = el.attr('data-toporder') === "true";
        }

        sortByScore = val;
        highlightActiveOrdering(el);
        setActivePage(1);
    }

    function highlightActiveOrdering(el) {
        orderContainer.find('.active').removeClass('active');
        el.addClass('active');
    }

    init();


}(window.jQuery));

