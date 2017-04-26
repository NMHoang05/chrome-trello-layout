window.onload = function() {
    var theBoard = $("#board");

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

    chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
        if (!msg || !msg.source) return;
        
        switch (msg.source) {
            case "chrome-trello-layout-init":
                chrome.extension.sendRequest({
                    source: 'chrome-trello-layout-init',
                    url: location.href,
                    choice: choice
                });
                break;
            case "chrome-trello-layout-choice":
                switch(msg.choice) {
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
                localStorage.setItem('chrome-trello-layout.choice', msg.choice);
                switch(msg.choice) {
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
                choice = msg.choice;
                localStorage.setItem('chrome-trello-layout.count', msg.count);
                localStorage.setItem('chrome-trello-layout.format', JSON.stringify(msg.list));
                layoutApply(msg);
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
        localStorage.setItem('chrome-trello-layout.choice', 0);
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
        localStorage.setItem('chrome-trello-layout.choice', 1);
        choice = 1;
        theBoard.addClass('chrome-trello-layout-grid');
        theBoard.removeClass('chrome-trello-layout-column');
        theBoard.removeClass('chrome-trello-layout-row');
    }

    function layoutDataFetch() {
        chrome.extension.sendRequest({
            source: 'chrome-trello-layout-fetch',
            choice: choice,
            count: localStorage.getItem('chrome-trello-layout.count') || 1,
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
        for(i = 0; i < data.list.length; i++) {
            for(var j = 0; j < data.list[i].length; j++) {
                if (data.list[i][j] == '<b>[New List]</b>') {
                    grps[i].append(add_list[0]);
                } else {
                    var nd = helpers.find_list_node_with_name(data.list[i][j]);
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

    var choice = localStorage.getItem('chrome-trello-layout.choice') || 0;
    var init_obj = {
        source: 'chrome-trello-layout-init',
        url: location.href,
        choice: choice
    };
    switch(choice) {
        case '1':
            gridLayout();
            break;
        case '2':
            init_obj.list = getHeadersList();
            break;
        case '3':
            init_obj.list = getHeadersList();
            break;
    }
    
    chrome.extension.sendRequest(init_obj);
};

