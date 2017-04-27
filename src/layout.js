window.onload = function() {
    var theBoard = $("#board");
    var board_url = location.href;
    var storage_key_choice = "chrome-trello-layout.choice|" + board_url;
    var storage_key_count = "chrome-trello-layout.count|" + board_url;
    var storage_key_extra = "chrome-trello-layout.extra|" + board_url;
    var storage_key_format = "chrome-trello-layout.format|" + board_url;

    var helpers = {
        find_list_node_with_name: function(name) {
            var nds = theBoard.find('> .list-wrapper');
            var h2;
            for(var i = 0; i < nds.length; i++) {
                h2 = $(nds[i]).find('h2.list-header-name-assist');
                if (h2.html() == name) return nds[i];
            }
            return null;
        }
    };

    var choice = localStorage.getItem(storage_key_choice) || 0;
    function get_init_object() {
        var init_obj = {
            source: 'chrome-trello-layout-init',
            url: location.href,
            choice: choice
        };
        var data;
        switch (choice) {
            case '2':
            case '3':
                init_obj.list = getHeadersList();
                init_obj.count = localStorage.getItem(storage_key_count);
                init_obj.extra = localStorage.getItem(storage_key_extra);
                init_obj.format = null;
                data = localStorage.getItem(storage_key_format);
                if (data != null) {
                    try {
                        data = JSON.parse(data);

                        init_obj.format = data;
                    } catch (e) {
                    }
                }
                break;
        }
        return init_obj;
    }

    chrome.runtime.onMessage.addListener(function(data, _, sendResponse) {
        if (!data || !data.source) return;
        
        switch (data.source) {
            case "chrome-trello-layout-init":
                chrome.extension.sendRequest(get_init_object());
                break;
            case "chrome-trello-layout-choice":
                switch(data.choice) {
                    case '0':
                        defaultLayout();
                        break;
                    case '1':
                        gridLayout();
                        break;
                    case '2':
                    case '3':
                        layoutDataFetch();
                        break;
                }
                break;
            case "chrome-trello-layout-apply":
                localStorage.setItem(storage_key_choice, data.choice);
                switch(data.choice) {
                    case '2':
                        theBoard.removeClass('chrome-trello-layout-grid');
                        theBoard.addClass('chrome-trello-layout-column');
                        theBoard.removeClass('chrome-trello-layout-row');
                        break;
                    case '3':
                        theBoard.removeClass('chrome-trello-layout-grid');
                        theBoard.removeClass('chrome-trello-layout-column');
                        theBoard.addClass('chrome-trello-layout-row');
                        break;
                }
                choice = data.choice;
                localStorage.setItem(storage_key_count, data.count);
                localStorage.setItem(storage_key_extra, data.extra);
                localStorage.setItem(storage_key_format, JSON.stringify(data.format));
                layoutApply(data);
                break;
        }
    });
    
    function getHeadersList() {
        var list = [];
        var h2s = $('h2.list-header-name-assist');
        for(var i = 0; i < h2s.length; i++) {
            list.push(h2s[i].innerHTML);
        }
        return list;
    }

    function defaultLayout() {
        if (theBoard.find('> .chrome-trello-group').length > 0) {
            var nds = theBoard.find('.list-wrapper');

            for(var i = 0; i < nds.length; i++) {
                theBoard.append(nds[i]);
            }
            theBoard.find('> .chrome-trello-group').remove();
        }
        localStorage.setItem(storage_key_choice, 0);
        choice = 0;
        theBoard.removeClass('chrome-trello-layout-grid');
        theBoard.removeClass('chrome-trello-layout-column');
        theBoard.removeClass('chrome-trello-layout-row');
    }

    function gridLayout() {
        if (theBoard.find('> .chrome-trello-group').length > 0) {
            var nds = theBoard.find('.list-wrapper');

            for(var i = 0; i < nds.length; i++) {
                theBoard.append(nds[i]);
            }
            theBoard.find('> .chrome-trello-group').remove();
        }
        localStorage.setItem(storage_key_choice, 1);
        choice = 1;
        theBoard.addClass('chrome-trello-layout-grid');
        theBoard.removeClass('chrome-trello-layout-column');
        theBoard.removeClass('chrome-trello-layout-row');
    }

    function layoutDataFetch() {
        chrome.extension.sendRequest({
            source: 'chrome-trello-layout-fetch',
            choice: choice,
            count: localStorage.getItem(storage_key_count) || 1,
            list: getHeadersList()
        });
    }

    function layoutApply(data) {
        // remove old groups
        var nds = theBoard.find('.list-wrapper');

        for(var i = 0; i < nds.length; i++) {
            theBoard.append(nds[i]);
        }
        theBoard.find('> .chrome-trello-group').remove();

        if (data.extra == 0) {
            theBoard.addClass('shared-scroll');
        } else {
            theBoard.removeClass('shared-scroll');
        }

        var grps = [];
        var dimension = Math.floor(100.0 / data.count);
        var dimension_name = choice == 2 ? 'width' : 'min-height';

        for(var i = 0; i < data.count; i++) {
            grps[i] = $('<div class="chrome-trello-group u-fancy-scrollbar"></div>');
            grps[i].appendTo(theBoard);

            grps[i].css(dimension_name, dimension + '%');
        }

        var add_list = $('.js-add-list');
        for(i = 0; i < data.format.length; i++) {
            for(var j = 0; j < data.format[i].length; j++) {
                if (data.format[i][j] == '<b>[New List]</b>') {
                    grps[i].append(add_list[0]);
                } else {
                    var nd = helpers.find_list_node_with_name(data.format[i][j]);
                    if (nd != null) {
                        grps[i].append(nd);
                    }
                }
            }
        }

        var nds = theBoard.find('> .list-wrapper');
        for(var i = 0; i < nds.length; i++) {
            grps[0].append(nds[i]);
        }
    }

    var init_load = get_init_object();
    switch (init_load.choice) {
        case '1':
            gridLayout();
            break;
        case '2':
            theBoard.removeClass('chrome-trello-layout-grid');
            theBoard.addClass('chrome-trello-layout-column');
            theBoard.removeClass('chrome-trello-layout-row');
            if (init_load.format != null) {
                layoutApply(init_load);
            }
            break;
        case '3':
            theBoard.removeClass('chrome-trello-layout-grid');
            theBoard.removeClass('chrome-trello-layout-column');
            theBoard.addClass('chrome-trello-layout-row');
            if (init_load.format != null) {
                layoutApply(init_load);
            }
            break;
    }
    chrome.extension.sendRequest(init_load);
};

