window.onload = function() {
    var helpers = {
        from_same_domain: function(refer) {
          if (refer.length == 0) return false;
          var ref = refer.replace(/(http\:\/\/|https\:\/\/)/gi, "");
          var i = ref.indexOf('/');
          if (i == -1) return false;
          ref = ref.substring(0, i);
          return ref == "trello.com";
        }
    }

    chrome.extension.onRequest.addListener(receiveMessage);

    function sendMessage(msg) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            lastTabId = tabs[0].id;
            chrome.tabs.sendMessage(lastTabId, msg);
        });
    }
    
    function receiveMessage(data, sender, sendResponse) {
        if (!data || !data.source) return;
        
        switch (data.source) {
            case 'chrome-trello-layout-init':
                if (helpers.from_same_domain(data.url)) {
                    $('#init-mask').remove();
                    $('#extension-content').css('display', 'block');
                }
                break;
        }
    }

    var choice = localStorage.getItem('chrome-trello-layout.choice') || 0;
    var prev_option = null;
    $('input[name=layout-choice]').each(function() {
        var inst = $(this);
        var wrp = inst.parent();
        if (inst.val() == choice) {
            inst.prop('checked', true);
            wrp.attr('data-state', 'active');
            prev_option = wrp;
        }

        inst.on('click', function() {
            if (prev_option != null) prev_option.removeAttr('data-state');
            wrp.attr('data-state', 'active');
            prev_option = wrp;

            localStorage.setItem('chrome-trello-layout.choice', inst.val());
            sendMessage({
                source: 'chrome-trello-layout-choice',
                choice: inst.val()
            });
        });
    });
    
    sendMessage({
        source: 'chrome-trello-layout-init'
    });
};



