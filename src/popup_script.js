window.onload = function() {
    chrome.extension.onRequest.addListener(function(data, sender, sendResponse) {
        console.log('received ', data);
    });

    function sendMessage(msg) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            lastTabId = tabs[0].id;
            chrome.tabs.sendMessage(lastTabId, msg);
        });
    }

    var prev_option = null;
    $('input[name=layout-choice]').each(function() {
        var inst = $(this);

        var wrp = inst.parent();
        inst.on('click', function() {
            if (prev_option != null) prev_option.removeAttr('data-state');
            wrp.attr('data-state', 'active');
            prev_option = wrp;

            sendMessage({
                source: 'chrome-trello-layout',
                choice: inst.val()
            });
        });
    });
};



