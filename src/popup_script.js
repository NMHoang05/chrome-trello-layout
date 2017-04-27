window.onload = function() {
    var choice = 0;
    var layout_choice_box = null;
    var layout_count = 0;
    var full_item_list;
    var item_list;
    var helpers = {
        from_same_domain: function(refer) {
          if (refer.length == 0) return false;
          var ref = refer.replace(/(http\:\/\/|https\:\/\/)/gi, "");
          var i = ref.indexOf('/');
          if (i == -1) return false;
          ref = ref.substring(0, i);
          return ref == "trello.com";
        },
        get_text_of_node: function(node, level) {
            var i, result, text, child;
            result = '';
            for (i = 0; i < node.childNodes.length; i++) {
                child = node.childNodes[i];
                text = null;
                if (child.nodeType === 1 && level > 0) {
                    text = getTextFromNode(child, level - 1);
                } else if (child.nodeType === 3) {
                    text = child.nodeValue;
                }
                if (text) {
                    result += text;
                }
            }
            return result;
        },
        is_last_node_br: function(node) {
            if (node.childNodes.length > 0) {
                return node.childNodes[node.childNodes.length - 1].tagName == 'BR';
            }
            return false;
        },
        remove_last_br: function(node) {
            if (node.childNodes.length > 0) {
                var child = node.childNodes[node.childNodes.length - 1];
                if (child.tagName == 'BR') {
                    child.remove();
                }
            }
        },
        select_after_last_node: function(node) {
            if (node.childNodes.length == 0) return;
            var child = node.childNodes[node.childNodes.length - 1]
            var selection = window.getSelection();
            var range = document.createRange();
            range.setStartAfter(child);
            range.setEndAfter(child);
            selection.removeAllRanges();
            selection.addRange(range);
        },
        remove_from_array: function(array, element) {
            var i = array.indexOf(element);
            if (i > -1) array.splice(i, 1);
        },
        intersection: function(){
            return Array.from(arguments).reduce(function(previous, current){
                return previous.filter(function(element){
                    return current.indexOf(element) > -1;
                });
            });
        },
        difference: function(){
            return Array.from(arguments).reduce(function(previous, current){
                return previous.filter(function(element){
                    return current.indexOf(element) == -1;
                });
            });
        }
    };

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
                    choice = data.choice;
                    var rdo = $('input[name=layout-choice][value=' + choice + ']');
                    prev_option = rdo.parent();
                    prev_option.attr('data-state', 'active');
                    rdo.prop('checked', true);
                    
                    layout_choice_box = prev_option.siblings('.content');

                    switch (choice) {
                        case '2':
                        case '3':
                            init_layout_box(data);
                            break;
                    }
                }
                break;
            case 'chrome-trello-layout-fetch':
                layout_choice_box = prev_option.siblings('.content');
                switch (choice) {
                    case '2':
                    case '3':
                        init_layout_box(data);
                        break;
                }
                break;
        }
    }

    var prev_option = null;
    $('input[name=layout-choice]').each(function() {
        var inst = $(this);
        var wrp = inst.parent();

        inst.on('click', function() {
            if (prev_option != null) prev_option.removeAttr('data-state');
            wrp.attr('data-state', 'active');
            prev_option = wrp;

            choice = inst.val();
            sendMessage({
                source: 'chrome-trello-layout-choice',
                choice: choice
            });
        });
    });

    var markup_header = ['<div class="column-header">',
        'Count: <input type="number" id="count-input" min="1" max="5" /> (from 1 ~ 5)<br/>',
        '<label class="option"><input type="checkbox" name="individual-column-scroll" /> Individual scroll for each column</label>',
    '</div><br/>'];
    var markup_header_r = ['<div class="column-header">',
        'Count: <input type="number" id="count-input" min="1" max="5" /> (from 1 ~ 5)<br/>',
        '<label class="option"><input type="checkbox" name="individual-column-scroll" /> Individual scroll for each row</label>',
        '</div><br/>'];

    var markup_list = ['<div class="item-list-wrapper">',
        '<div class="item-list" contenteditable="plaintext-only"></div>',
        '<div class="item-auto-list"></div>',
    '</div>'];
    var markup_footer = '<br/><div><button type="button" id="btn-apply">Apply</button></div>';
    
    function init_layout_box(data) {
        full_item_list = data.list;
        full_item_list.push('<b>[New List]</b>');
        item_list = full_item_list.slice();
        layout_count = parseInt(data.count);

        layout_choice_box.html('');

        var header = $((choice == 2 ? markup_header : markup_header_r).join(''));
        header.appendTo(layout_choice_box);
        header.find('input[name=individual-column-scroll]').prop('checked', data.extra == 1);
        var count_input = header.find('#count-input');
        count_input.val(layout_count);
        count_input.on('input', function() {
            layout_count = Math.max( Math.min(parseInt(count_input.val()), 5), 1);
            populate_inputs();
        });

        var lists = [];
        var ls;
        for (var i = 0; i < layout_count; i++) {
            ls = $(markup_list.join(''));
            ls.appendTo(layout_choice_box);
            handle_autolist(ls, data.format != null ? data.format[i] : null );
            lists.push(ls);
        }
        var footer = $(markup_footer);
        footer.appendTo(layout_choice_box);
        footer.find('#btn-apply').click(apply_layout);

        function populate_inputs() {
            item_list = full_item_list.slice();
            header.detach();
            footer.detach();

            layout_choice_box.html('');

            header.appendTo(layout_choice_box);

            var lists = [];
            var ls;
            for (var i = 0; i < layout_count; i++) {
                ls = $(markup_list.join(''));
                ls.appendTo(layout_choice_box);
                handle_autolist(ls, null);
                lists.push(ls);
            }

            footer.appendTo(layout_choice_box);
        }
    }

    function handle_autolist(inst, loaded_items) {
        var auto_list = inst.find('.item-auto-list');
        var input = inst.find('.item-list');
        var input_nd = input[0];
        var timer_blur = null;

        if (loaded_items != null) {
            for(var i = 0; i < loaded_items.length; i++) {
                $('<span class="item" contenteditable="false">' + loaded_items[i] + '</span>').prependTo(input);
                helpers.remove_from_array(item_list, loaded_items[i]);
            }
            if (!helpers.is_last_node_br(input_nd)) $('<br>').appendTo(input);
        }

        function get_current_list() {
            var result = [];
            var list = input.find('.item');
            for (var i = 0; i < list.length; i++) {
                result.push(list[i].innerHTML);
            }
            return result;
        }

        function populate_list() {
            auto_list.html('');
            var it;
            for (var i = 0; i < item_list.length; i++) {
                it = $('<span class="item">' + item_list[i] + "</span>");
                it.appendTo(auto_list);
                it.click(pick_item);
            }

            it = $('<span class="item no-item">no match</span>');
            it.appendTo(auto_list);
        }

        function scan() {
            var txt = helpers.get_text_of_node(input_nd, 0).toLowerCase();
            var match_count = 0;
            var items = auto_list.find('.item:not(.no-item)');
            var cont;
            for( var i = 0; i < items.length; i++) {
                cont = items[i].innerText.toLowerCase();
                if (cont.indexOf(txt) > -1 || txt.indexOf(cont) > -1) {
                    $(items[i]).removeClass('not-match').addClass('match');
                    match_count++;
                } else {
                    $(items[i]).removeClass('match').addClass('not-match');
                }
            }
            if (match_count == 0) {
                auto_list.attr('data-empty', 'true');
            } else {
                auto_list.removeAttr('data-empty');
            }
        }

        function pick_item() {
            if (timer_blur != null) {
                input.focus();
                clearTimeout(timer_blur);
                timer_blur = null;
            }
            var val = this.innerHTML;
            $(this).remove();

            item_list.splice( item_list.indexOf(val), 1 );
            helpers.remove_last_br(input_nd);
            $('<span class="item" contenteditable="false">' + val + '</span>').prependTo(input);
            if (!helpers.is_last_node_br(input_nd)) $('<br>').appendTo(input);

            helpers.select_after_last_node(input_nd);
        }

        input.focus(function() {
            if (timer_blur != null) return;

            populate_list();
            auto_list.css('display', 'block');
            scan();
        });

        input.keydown(function(e) {
            switch (e.which) {
                case 8:
                case 46:
                    var bef_list = get_current_list();
                    setTimeout(function() {
                        var aft_list = get_current_list();

                        var diff = helpers.difference(bef_list, aft_list);
                        item_list = diff.concat(item_list);
                        item_list.sort(function(a, b) { return a.indexOf('<b>') > -1});
                        populate_list();

                        if (!helpers.is_last_node_br(input_nd)) $('<br>').appendTo(input);

                        scan();
                    }, 100);
                    break;
                case 13:
                    e.preventDefault();
                    break;
                default:
                    setTimeout(scan, 25);
                    break;
            }
        });

        input.blur(function() {
            if (timer_blur != null) clearTimeout(timer_blur);
            timer_blur = setTimeout(function() {
                timer_blur = null;

                auto_list.css('display', 'none');
            }, 150);
        });
    }

    function apply_layout() {
        var format = [];
        var list;
        var inp_lst = layout_choice_box.find('.item-list');
        var items;
        for (var i = 0; i < inp_lst.length; i++) {
            list = [];
            items = $(inp_lst[i]).find('.item');
            for(var j = 0; j < items.length; j++) {
                list.push(items[j].innerHTML);
            }
            format.push(list);
        }
        sendMessage({
            source: 'chrome-trello-layout-apply',
            choice: choice,
            count: layout_count,
            extra: $('input[name=individual-column-scroll]').is(':checked') ? 1 : 0,
            format: format
        });
    }
    
    sendMessage({
        source: 'chrome-trello-layout-init'
    });
};



