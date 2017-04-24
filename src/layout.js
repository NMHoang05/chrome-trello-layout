window.onload = function() {
    var theBoard = $("#board");
    chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
        if (!msg || !msg.source) return;
        
        switch (msg.source) {
            case "chrome-trello-layout-init":
                chrome.extension.sendRequest({
                    source: 'chrome-trello-layout-init',
                    url: location.href
                });
                break;
            case "chrome-trello-layout-choice":
                localStorage.setItem('chrome-trello-layout.choice', msg.choice);
                switch(msg.choice) {
                    case '0':
                        defaultLayout();
                        break;
                    case '1':
                        gridLayout();
                        break;
                    case '2':
                        columnLayout(msg.data);
                        break;
                    case '3':
                        rowLayout(msg.data);
                        break;
                }
                break;
        }
    });

    function defaultLayout() {
        theBoard.removeClass('chrome-trello-layout-grid');
        theBoard.removeClass('chrome-trello-layout-column');
        theBoard.removeClass('chrome-trello-layout-row');
    }

    function gridLayout() {
        theBoard.addClass('chrome-trello-layout-grid');
        theBoard.removeClass('chrome-trello-layout-column');
        theBoard.removeClass('chrome-trello-layout-row');
    }

    function columntLayout(data) {
        theBoard.removeClass('chrome-trello-layout-grid');
        theBoard.addClass('chrome-trello-layout-column');
        theBoard.removeClass('chrome-trello-layout-row');
    }

    function rowLayout(data) {
        theBoard.removeClass('chrome-trello-layout-grid');
        theBoard.removeClass('chrome-trello-layout-column');
        theBoard.addClass('chrome-trello-layout-row');
    }
    
    var choice = localStorage.getItem('chrome-trello-layout.choice') || 0;
    switch(choice) {
        case '1':
            gridLayout();
            break;
        case '2':
            columnLayout(msg.data);
            break;
        case '3':
            rowLayout(msg.data);
            break;
    }
    
    chrome.extension.sendRequest({
        source: 'chrome-trello-layout-init',
        url: location.href
    });
};

