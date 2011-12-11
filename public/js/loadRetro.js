//TODO: extract all urls
//TODO: move generic methods to common place

var Ideaboardz = function() {
    var that = this;
    this.init = function() {
        fillSectionsAndAttachEvents();
        that.refreshSections();
    };

    var fillSectionsAndAttachEvents = function() {
        var showAddSticky = function(sectionId) {
          var addStickyForm = $('#section'+sectionId).find(".addStickyForm");
          var textInputArea = addStickyForm.find('textarea');
          addStickyForm.show('slow');
          textInputArea.focus();
        };

        $('.section').each(function(){
            var section = $(this);
            var sectionId = section.attr('id').replace('section','');
            $(this).find('.addStickyButton').click(function() {
                showAddSticky(sectionId);
            });
            var addStickyForm = $('#section'+sectionId).find(".addStickyForm");
            var textInputArea = addStickyForm.find('textarea');
            textInputArea.keypress(function(e) {
                if(e.keyCode == 13){
                    addStickyForm.hide('slow');
                    addStickyTo(sectionId);
                    return;
                }
                if(e.keyCode == 27){
                    addStickyForm.hide('slow');
                }
            });
            textInputArea.blur(function() {
                addStickyForm.hide('slow');
                addStickyTo(sectionId);
            });

        });
    };



    var addStickyTo = function(sectionId) {
            var stickyText = $('#section'+sectionId).find('textarea').val().trim();
            if(stickyText.length>0){
                $('.stickyText').val("");
                $a.trackEvent('point', 'create', stickyText);
                $.ajax({
                    url: '/points.json?point[section_id]='+ sectionId +'&point[message]=' + encodeURIComponent(stickyText),
                    type: "POST",
                    success: function(result) {
                        addSticky(result);
                    }
                });
            }
    };

    var addSticky = function(point) {
        var stickyTemplateHtml = $('#stickyTemplate').html();
        $(stickyTemplateHtml).appendTo('#section' + point.section_id + ' .points');
        var addedPoint = $('#section' + point.section_id).find('div.sticky:last');
        addedPoint.hide().attr('title', point.message)
          .attr('id', 'point' + point.id)
          .attr('data-id',point.id)
          .find('.stickyText').html(point.message);
            addedPoint.find('.voteCount .count').html(point.votes_count);
        attachStickyEvents(addedPoint);
        addedPoint.show('slow');
    };

    var attachStickyEvents=function(addedPoint){
        addedPoint.click(function()
        {
            var sectionId = $(this).parents('.section').attr('id').replace("section", "");
            var pointId = $(this).attr('data-id');
            showLargeStickyDialog(addedPoint,sectionId,pointId);
        });
    };

    var showLargeStickyDialog = function(addedPoint,sectionId,pointId){
        var colorOfSticky = addedPoint.parents('.section').attr('data-color');
        var uiDialog = $('#largeStickyDialog').parent('.ui-widget-content');
        uiDialog.removeClass(uiDialog.attr('class').split(/\s+/).pop())
                .addClass(colorOfSticky);

        $('#largeStickyDialog').find('.stickyText').html(addedPoint.find('.stickyText').html());
        $('#largeStickyDialog').find('span.voteCount .count').html(addedPoint.find('.voteCount .count').html());
        $('#largeStickyDialog').find('.removeStickyButton').unbind('click').click(
                function() {removeStickyCall(sectionId, pointId); $('#largeStickyDialog').dialog('close'); });
        $('#largeStickyDialog').find('.voteStickyButton').unbind('click').click(
                function() {addVote(pointId)});

        $('#largeStickyDialog').dialog('open');
    };

    var addVote = function(pointId) {
        $.ajax({
            url: "/points/" + pointId + "/votes.json",
            type: "POST",
            data: {"vote": {"point_id": parseInt(pointId, 10) }},
            success: function(result) {
                var newVoteCount = parseInt($('#point'+pointId).find('.voteCount .count').html(),10)+1;
                $('#point'+pointId+',#largeStickyDialog').find('.voteCount .count').html(newVoteCount);
            }
        });
    };

    var removeStickyCall = function(sectionId, pointId) {
        $a.trackEvent('point', 'delete', $('#point' + pointId + " .stickyText").text());
        removeSticky(pointId);
        $.ajax({
            url: "/sections/" + sectionId + "/points/delete/" + pointId + ".json",
            type: "GET"
        });
    };

    var removeSticky = function(pointId) {
        $('#point' + pointId).hide('slow', function() {
            $('#point' + pointId).remove();
        });
    };

    var displaySectionPoints = function(data) {
        var allPointIds = [];
        for(var pointIndex in data) {
            var point = data[pointIndex];
            if (!isAlreadyExisting(point.id)) {
                addSticky(point);
            }
            else {
                updateSticky(point);
            }
            allPointIds.push(point.id + "");
        }
        if(data && data[pointIndex]){
            removePointHtmlIfNotInData(allPointIds);
        }
        $U.filterStickies();
    };

    var updateSticky =  function(point){
        $('#point'+point.id).find('.voteCount .count').html(point.votes_count);
        $('#point'+point.id).find('stickyText').html(point.message);
    };

    var removePointHtmlIfNotInData = function(allPointIdsFromServer) {
        $('.points').find('.sticky').each(function() {
            var pointId = $(this).attr('data-id');
            if (jQuery.inArray(pointId, allPointIdsFromServer) == -1) {
                removeSticky(pointId);
            }
        });
    };

    var isAlreadyExisting = function(pointId) {
        return $('#point' + pointId).length > 0;
    };

    this.refreshSections = function() {
      var retroId = $('meta[name="retroId"]').attr('content');
      $.getJSON("/retros/" + retroId + "/points.json", displaySectionPoints);
    };
};

$(document).ready(function() {
    var ideaBoardz = new Ideaboardz();
    ideaBoardz.init();
    $('#largeStickyDialog').dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true
    });
    setInterval(ideaBoardz.refreshSections, 10000);
    $('#sortBy').change($U.sortStickies).change();
    $('#search').keyup($U.filterStickies);
    $('#retro_section_id').change($U.filterSection).change();
    $("#pdfExport,#excelExport").click(
      function(){$a.trackEvent('board', $(this).attr('id'),window.location.pathname.replace('/for/','') );
    });
});