// ==UserScript==
// @name         LBB - CSV Export
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Download transactions history in csv
// @author       Benjamin Kemner
// @match        https://amazon.lbb.de/transactions
// @grant        none
// @require      http://code.jquery.com/jquery-3.0.0.slim.js
// ==/UserScript==

(function() {
    'use strict';

    function fill_zero(v){
        if(v < 10) {return '0' + v;}
        return v;
    }

    function read_cookie(name) {
        var name_eq = name + "=";
        var ca = document.cookie.split(';');

        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(name_eq) == 0) return c.substring(name_eq.length, c.length);
        }

        return null;
    }

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    function convert_to_csv(json){
        var str = '';

        var transactions = json.transactions;

        for(var i = 0; i < transactions.length; i++){
            if(!transactions[i].booked){
                continue;
            }

            str +=
                transactions[i].transactionId + ";" +
                new Date(transactions[i].bookingDate).toLocaleDateString() + ";" +
                new Date(transactions[i].transactionDate).toLocaleDateString() + ";" +
                transactions[i].details + ";" +
                transactions[i].details + ";" +
                (transactions[i].euroAmount/-100) + ";\r\n";
        }

        return str;
    }

    var button = $('<button></button>');

    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = d.getMonth() + 1;
    var dd = d.getDate();

    var from = yyyy + '-' + fill_zero(mm - 2) + '-' + fill_zero(dd);
    var to =  yyyy + '-' + fill_zero(mm) + '-' + fill_zero(dd);

    button
        .text('Export CSV')
        .click(function(){

            fetch("https://amazon.lbb.de/api/program/ama/" + read_cookie("program_account_number") + "/transactions?from=" + $('#input_from').val() + "&to=" + $('#input_to').val(), {
                "credentials": "include",
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                    "authorization": "Bearer " + read_cookie("access_token"),
                    "cache-control": "no-cache",
                    "content-type": "application/json; charset=utf-8",
                    "pragma": "no-cache",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin"
                },
                "referrer": "https://amazon.lbb.de/transactions",
                "referrerPolicy": "same-origin",
                "body": null,
                "method": "GET",
                "mode": "cors"
        })
            .then(response => response.json())
            .then(json => download("amazon_lbb_" + $('#input_from').val() + "_" + $('#input_to').val() + ".csv", convert_to_csv(json)))
    });

    var input_from = $('<input type="text" id="input_from" />');
    var input_to = $('<input type="text" id="input_to" />');

    input_from.val(from);
    input_to.val(to);

    $('h1')
        .parent()
        .prepend('<br />')
        .prepend('<br />')
        .prepend(button)
        .prepend(input_to)
        .prepend(input_from);

})();