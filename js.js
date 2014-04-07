(function ($) {
    'use strict';

    //
    // Common
    //

    var slice = Array.prototype.slice;

    function arrToObject (val, idx) {
        return {
            idx: idx,
            val: val
        };
    }

    function prepareForSort(arr) {
        return $.map(arr, arrToObject);
    }

    function sortArrByArr(arr, sortArr, sortKey) {
        var result = [], i, l, sortIdx;

        for(i = 0, l = arr.length; i < l; i++) {
            sortIdx = sortKey ? sortArr[i][sortKey] : sortArr[i];
            result[i] = arr[sortIdx];
        }

        return result;
    }

    function sortByKey(key) {

        return function (a, b) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
            return 0;
        };

    }

    function parseFlt(val) { return parseFloat(val); }
    function parseInt10(val) { return parseInt(val, 10); }

    function parseSelector(selector, parseVal) {
        return function (idx, el) {
            var item, text, val;

            item = $(el).find(selector);
            text = item.text();
            val = text.replace(/[^0-9\.]/, "");

            return parseVal(val);
        }
    }

    //
    // Reviews: pagination + ordering
    //

    (function () {

        var section, list, items, orderedItems, scores, pagesContainer, orderContainer,
            lastActive, perPage, sortByScore = true;

        perPage = 5;

        function init() {
            var pages;

            section = $('.reviews');
            list = section.find('.reviews_list');
            items = list.find('.one_review');

            scores = prepareForSort(gatherScores(items))
                        .sort(sortByKey('val'))
                        .reverse();

            // remove items from DOM
            items.remove();
            orderedItems = sortArrByArr(items, scores, 'idx');

            pages = preparePages(computePages(items));
            pagesContainer = pages.clone().addClass('reviews_pages_top');
            bindClickPages(pagesContainer);
            section.append(pagesContainer);

            orderContainer = prepareOrderingContainer();
            section.find('h2:first').append(orderContainer);
            bindOrderingOptions(orderContainer.find('.reviews_order_item'));

            setActiveOrdering(sortByScore);
        }

        function gatherScores(items) {
            return $(items).map(parseSelector('.review_score', parseInt10));
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


    }());


    //
    // Room table
    //

    // Improve the room table. Some ideas you may consider:
    // - allow the user to sort the rooms table by occupancy or price
    // - display a total when the user selects a quantity
    // - display additional information about rooms.

    (function () {

        var section, table, rooms,
            prices, occupancies, orderedRooms = {},
            orderType, orderDir;

        function init() {
            var pricesForSort, occupanciesForSort;

            section = $('.rooms');
            table = section.find('.rooms_table');
            rooms = table.find('.one_room');

            //rooms.remove();

            prices = gatherPrices(rooms);
            occupancies = gatherOccupancies(rooms);

            pricesForSort = prepareForSort(prices).sort(sortByKey('val'));
            occupanciesForSort = prepareForSort(occupancies).sort(sortByKey('val'));

            orderedRooms['price'] = sortArrByArr(rooms, pricesForSort, 'idx');
            orderedRooms['occupancy'] = sortArrByArr(rooms, occupanciesForSort, 'idx');

            addOrderOption();
        }

        function updateRooms() {
            var roomsForAdd, tbody;

            roomsForAdd = slice.call(orderedRooms[orderType] || rooms);
            tbody = table.find('tbody');

            tbody.empty();

            tbody.append(orderDir === 'up' ? roomsForAdd : roomsForAdd.reverse());
        }

        function gatherPrices(items) {
            return items.map(parseSelector('.room_price', parseFlt));
        }

        function gatherOccupancies(items) {
            return items.map(parseSelector('.room_occupancy', parseInt10));
        }

        function clearOrdering() {
            table.find('.active_up, .active_down').removeClass('active_up active_down');
        }

        function bindOrder(els) {
            els.on('click', function (e) {
                var _this, el, isActiveDown;

                _this = $(this);
                el = _this.find('span');

                isActiveDown = el.hasClass('active_down');

                clearOrdering();
                el.addClass(isActiveDown ? 'active_up': 'active_down');

                orderType = _this.hasClass('room_price') ? 'price' : 'occupancy';
                orderDir = isActiveDown ? 'up' : 'down';
                updateRooms();
            });
        }

        function addOrderOption() {
            var ths = table
                .find('thead')
                .find('.room_occupancy, .room_price');

            ths.wrapInner('<span class="orderable">');

            bindOrder(ths);
        }

        init();

    }());

}(window.jQuery));


