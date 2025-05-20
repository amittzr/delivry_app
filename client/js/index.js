$(document).ready(function () {
      $("button").click(function () {
        $.ajax({
          url: "api/users",
          success: function (result) {
            let str='';
            $.each(result, function (index, value) {
              str += "<div><span>name is: "+value.name+"</span>";
              str += ",<span> profession is: "+value.profession+"</span></div>";
            });
            $("#div1").html(str);
            console.log(result);
          },
          error: function (err) {
            console.log("err", err);
          }
        });

      });
    });