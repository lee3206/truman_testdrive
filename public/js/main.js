$(document).ready(function() {

  //close messages from flash message
  $('.message .close')
  .on('click', function() {
    $(this)
      .closest('.message')
      .transition('fade')
    ;
  });

  //this is the LIKE button
  $('.ui.animated.fade.button')
  .on('click', function() {
    $(this)
      .toggleClass( "red" )
    ;

     var postID = $(this).closest( ".ui.fluid.card.dim" ).attr( "postID" );
     var like = Date.now();
     console.log("***********LIKE: post "+postID+" at time "+like);
     $.post( "/feed", { postID: postID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

  //this is the FLAG button
  $('.ui.vertical.animated.button')
  .on('click', function() {
    $(this)
      .toggleClass( "red" )
    ;

     var postID = $(this).closest( ".ui.fluid.card.dim" ).attr( "postID" );
     var flag = Date.now();
     console.log("***********FLAG: post "+postID+" at time "+flag);
     $.post( "/feed", { postID: postID, flag: flag, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

  //User wants to REREAD
  $('.ui.button.reread')
  .on('click', function() {
    //.ui.active.dimmer
    $(this).closest( ".ui.dimmer" ).removeClass( "active" );
    $(this).closest( ".ui.fluid.card.dim" ).dimmer('hide');


     var postID = $(this).closest( ".ui.fluid.card.dim" ).attr( "postID" );
     var reread = Date.now();
     console.log("##########REREAD######SEND TO DB######: post "+postID+" at time "+reread);
     $.post( "/feed", { postID: postID, start: reread, _csrf : $('meta[name="csrf-token"]').attr('content') } );
     //maybe send this later, when we have a re-read event to time???
     //$.post( "/feed", { postID: postID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

  //Dimm cards as user scrolls - send Post to update DB on timing of events
  $('.ui.fluid.card.dim')
  .visibility({
    once       : false,
    continuous : false,


    //USER HAS NOW READ THE POST (READ EVENT)
    onBottomVisibleReverse:function(calculations) {
        console.log(":::::Now passing onBottomVisibleReverse:::::");

        //As Long as Dimmer is not Active and We have a UI condistion - Dimm screen and send Post READ event
        if (!($(this).dimmer('is active')) && ($(this).attr( "ui" )=='ui'))
        {
          console.log("::::UI passing::::DIMMING NOW::::::::");
          var postID = $(this).attr( "postID" );
          var read = Date.now();
          //actual dim the element
          $(this).dimmer({
                   closable: false
                  })
                  .dimmer('show');
          //send post to server to update DB that we have now read this
          console.log("::::UI passing::::SENDING POST TO DB::::::::");
          $.post( "/feed", { postID: postID, read: read, _csrf : $('meta[name="csrf-token"]').attr('content') } );

        }

        //if we are not in UI condistion, and we are reading, then send off Post to DB for new Read Time
        else if ($(this).attr( "ui" )=='no')
        {
          console.log("::::NO UI passing:::");
          var postID = $(this).attr( "postID" );
          var read = Date.now();
          //send post to server to update DB that we have now read this
          console.log("::::NO UI passing::::SENDING POST TO DB::::::::");
          $.post( "/feed", { postID: postID, read: read, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        }

        //UI and DIMMED READ, which does not count as a READ
        else
          {console.log("::::passing::::Already dimmed - do nothing - OR NO UI");}

      },

    ////POST IS NOW Visiable - START EVENT
    onBottomVisible:function(calculations) {
        console.log("@@@@@@@ Now Seen @@@@@@@@@");
        
        //Post is not DIMMED (SO WE CAN SEE IT) - and We are in UI condistion - POST START EVENT to DB
        if (!($(this).dimmer('is active')) && ($(this).attr( "ui" )=='ui'))
        {
          var postID = $(this).attr( "postID" );
          var start = Date.now();
          console.log("@@@@@@@ UI!!!! @@@@@@SENDING TO DB@@@@@@START POST UI has seen post "+postID+" at time "+start);

          $.post( "/feed", { postID: postID, start: start, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        }
        //if not UI, we still need to Update DB with new START time
        else if ($(this).attr( "ui" )=='no')
        {
          var postID = $(this).attr( "postID" );
          var start = Date.now();
          console.log("@@@@@@@ NO UI!!!! @@@@@@SENDING TO DB@@@@@@START@@@@@@@ POST has seen post "+postID+" at time "+start)
          $.post( "/feed", { postID: postID, start: start, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        }

        else
          {console.log("@@@@@@@ Now Seen @@@@@@@@@  START Already dimmed - do nothing - OR NO UI");}

        }
      


  })
;



});