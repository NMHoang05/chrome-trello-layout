window.onload = function() {
    var theBoard = $("#board");
    chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
        if (!(msg && msg.source === 'chrome-trello-layout')) return;
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

    $('#board').click(function() {
        console.log('clicked');
        chrome.extension.sendRequest('clicked');
    });
    
};

