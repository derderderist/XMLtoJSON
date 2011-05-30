$(document).ready(function(){
  var result = new XMLtoJSON({
    url: 'xml/example.xml'
  });
  $('#result, #time').hide();
  $('#source textarea').val(result.xml);
  $('#default textarea').val(js_beautify(JSON.stringify(result.json)));
  $('#examples div, #find div').each(function(){
    $(this).append('<span class="button">Run example</span>');
  });
  
  $('.button').click(function(){
    var code = $(this).parent().find('pre').html();
    code = code.replace(/(\n|\r|\v)/g,'').replace(/\s\s/g, '').replace('&gt;', '>').replace('&lt;', '<');
    eval(code);
    if($(this).parent().parent().attr('id') == 'find'){
      $(this).parent().append('<p class="result">' + JSON.stringify(data) +'</p>');
    }
    else{
      $('#result').attr('value', js_beautify(JSON.stringify(data.json))).show();
      $('#time').html('Result (' + data.duration + ')').show();
      $('#time, #result').appendTo($(this).parent());
      return false;
    }
  });
});