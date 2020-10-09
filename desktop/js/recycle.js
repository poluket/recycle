
/* This file is part of Jeedom.
 *
 * Jeedom is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Jeedom is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Jeedom. If not, see <http://www.gnu.org/licenses/>.
 */


$("#table_cmd").sortable({axis: "y", cursor: "move", items: ".cmd", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
/*
 * Fonction pour l'ajout de commande, appellé automatiquement par plugin.template
 */
function addCmdToTable(_cmd) {
    if (!isset(_cmd)) {
        var _cmd = {configuration: {}};
    }
    if (!isset(_cmd.configuration)) {
        _cmd.configuration = {};
    }
    var tr = '<tr class="cmd" data-cmd_id="' + init(_cmd.id) + '">';
    tr += '<td>';
    tr += '<span class="cmdAttr" data-l1key="id" style="display:none;"></span>';
    tr += '<input class="cmdAttr form-control input-sm" data-l1key="name" style="width : 140px;" placeholder="{{Nom}}">';
    tr += '</td>';
    tr += '<td>';
    tr += '<span class="type" type="' + init(_cmd.type) + '">' + jeedom.cmd.availableType() + '</span>';
    tr += '<span class="subType" subType="' + init(_cmd.subType) + '"></span>';
    tr += '</td>';
    tr += '<td>';
    tr += '<span><input type="checkbox" class="cmdAttr checkbox-inline" data-l1key="isHistorized" /> {{Historiser}}<br/></span>';
    tr += '<span><input type="checkbox" class="cmdAttr checkbox-inline" data-l1key="isVisible" /> {{Affichage}}<br/></span>';
    tr += '</td>';
    tr += '<td>';	
	if (is_numeric(_cmd.id)) {
        tr += '<a class="btn btn-default btn-xs cmdAction" data-action="configure"><i class="fa fa-cogs"></i></a> ';
        tr += '<a class="btn btn-default btn-xs cmdAction" data-action="test"><i class="fa fa-rss"></i> {{Tester}}</a>';
    }
    tr += '<i class="fa fa-minus-circle pull-right cmdAction cursor" data-action="remove"></i>';
    tr += '</td>';
    tr += '</tr>';
    $('#table_cmd tbody').append(tr);
    $('#table_cmd tbody tr:last').setValues(_cmd, '.cmdAttr');
    if (isset(_cmd.type)) {
        $('#table_cmd tbody tr:last .cmdAttr[data-l1key=type]').value(init(_cmd.type));
    }
    jeedom.cmd.changeType($('#table_cmd tbody tr:last'), init(_cmd.subType));
}


$('.Template[data-action=add]').off().on('click', function () {
    TemplateDialog('updateEqLogic','');
});
$('.eqLogicAction[data-action=addByTemplate]').off().on('click', function () {
  TemplateDialog('newEqLogic','');
});
function TemplateDialog(type,template){
  var Html = $('<div>').load('index.php?v=d&modal=eibd.addByTemplate&plugin=eibd&type=eibd',function(){
      var dialog = bootbox.dialog({
          title: "{{Ajout d'un équipement avec template}}",
          message: $(this).html(),
          buttons: {
              "Annuler": {
                  className: "btn-default",
                  callback: function () {
                      //el.atCaret('insert', result.human);
                  }
              },
              success: {
                  label: "Valider",
                  className: "btn-primary",
                  callback: function () {
                      var _el =$(this);
                      if(_el.find('.EqLogicTemplateAttr[data-l1key=template]').value() != ""){
                          $.ajax({
                              type: 'POST',   
                              url: 'plugins/eibd/core/ajax/eibd.ajax.php',
                              data:
                              {
                                  action: 'getTemplate',
                                  template:_el.find('.EqLogicTemplateAttr[data-l1key=template]').val()
                              },
                              dataType: 'json',
                              global: true,
                              error: function(request, status, error) {},
                              success: function(data) {
                                  if (data.state != 'ok') {
                                      $('#div_alert').showAlert({message: data.result, level: 'danger'});
                                      return;
                                  }
                                  var eqLogic=data.result;
                                  _el.find('.EqLogicTemplateAttr[data-l1key=name]').attr("disabled","false")
                                  _el.find('.EqLogicTemplateAttr[data-l1key=logicalId]').attr("disabled","false")
                                  _el.find('.EqLogicTemplateAttr[data-l1key=object_id]').attr("disabled","false")
                                  eqLogic.name=_el.find('.EqLogicTemplateAttr[data-l1key=name]').value();
                                  eqLogic.logicalId=_el.find('.EqLogicTemplateAttr[data-l1key=logicalId]').value();
                                  eqLogic.object_id=_el.find('.EqLogicTemplateAttr[data-l1key=object_id]').value();
                                  var typeTemplate=_el.find('.EqLogicTemplateAttr[data-l1key=template]').value();
                                  if (typeof(eqLogic.configuration) === 'undefined')
                                      eqLogic.configuration=new Object();
                                  $.each(eqLogic.options,function(id, option){
                                      if(typeof option.type == "undefined") {
                                          if(_el.find('.TemplateOption[data-l1key='+id+']').is(':checked')){
                                              typeTemplate = typeTemplate + "_" + id;
                                              $.each(option.cmd,function(idCmd, cmd){
                                                  eqLogic.cmd.push(cmd);
                                              });
                                          }
                                      }else{
                                          if(option.type == "cmd"){
                                              /*_el.find('.'+option.tag).each(function(){
                                              });*/
                                          }
                                      }
                                  });

                                  $.each(eqLogic.cmd,function(index, value){
                                      eqLogic.cmd[index].logicalId=searchSameCmd(_el,eqLogic,index,'');
                                      if (typeof(eqLogic.cmd[index].value) !== 'undefined')
                                          eqLogic.cmd[index].value="#["+_el.find('.EqLogicTemplateAttr[data-l1key=object_id] option:selected').text()+"]["+eqLogic.name+"]["+eqLogic.cmd[index].value+"]#";
                                      if(type == 'updateEqLogic')
                                          addCmdToTable(eqLogic.cmd[index]);
                                  });
                                  if(type == 'newEqLogic'){
                                      if($('.EqLogicTemplateAttr[data-l1key=name]').value() != ""){	
                                          eqLogic.configuration.typeTemplate = typeTemplate;
                                          SaveTemplate(eqLogic);
                                      }
                                  }
                              }
                          });
                      }

                  }
              },
          }
      });
      dialog.off('shown.bs.modal').on('shown.bs.modal', function(e){
          if(type == 'updateEqLogic'){
              $(this).find(".EqLogicTemplateAttr[data-l1key=name]").val($(".eqLogicAttr[data-l1key=name]").val()).attr("disabled","true");
              $(this).find(".EqLogicTemplateAttr[data-l1key=logicalId]").val($(".eqLogicAttr[data-l1key=logicalId]").val()).attr("disabled","true");
              $(this).find(".EqLogicTemplateAttr[data-l1key=object_id]").val($(".eqLogicAttr[data-l1key=object_id]").val()).attr("disabled","true");
          }
          if(template != '')
              $(this).find(".EqLogicTemplateAttr[data-l1key=template]").val(template).trigger('change').attr("disabled","true");
      });
      dialog.modal("show");
  });
};
function SaveTemplate(eqLogic){
  jeedom.eqLogic.save({
      type: 'eibd',
      eqLogics: [eqLogic],
      error: function (error) {
          $('#div_alert').showAlert({message: error.message, level: 'danger'});
      },
      success: function (_data) {
          var vars = getUrlVars();
          var url = 'index.php?';
          for (var i in vars) {
              if (i != 'id' && i != 'saveSuccessFull' && i != 'removeSuccessFull') {
                  url += i + '=' + vars[i].replace('#', '') + '&';
              }
          }
          modifyWithoutSave = false;
          url += 'id=' + _data.id + '&saveSuccessFull=1';
          loadPage(url);
      }
  });
};
function searchSameCmd(_el,eqLogic,index,option){
        var GAD='';
  if (typeof(eqLogic.cmd[index].SameCmd) !== 'undefined'){
      _el.find('.CmdEqLogicTemplateAttr[data-l2key=SameCmd]').each(function(){
          if($(this).val() == eqLogic.cmd[index].SameCmd){
              GAD =  _el.find(option + ' .CmdEqLogicTemplateAttr[data-l1key='+$(this).attr('data-l1key')+'][data-l2key=logicalId]').val();
                   return GAD;
          }
           });
           return GAD;
  }
  _el.find('.CmdEqLogicTemplateAttr[data-l2key=name]').each(function(){
      if($(this).val() == eqLogic.cmd[index].name){
          GAD =  _el.find(option + ' .CmdEqLogicTemplateAttr[data-l1key='+$(this).attr('data-l1key')+'][data-l2key=logicalId]').val();
          return GAD;
      }
  });
  return GAD;								
}
var _optionsMultiple=null;
$('body').off('change','.EqLogicTemplateAttr[data-l1key=template]').on('change','.EqLogicTemplateAttr[data-l1key=template]', function () {
  var cmds=$(this).closest('.bootbox-body').find('.CmdsTempates');
  cmds.html($('<div class="option_bt">'));
  $.ajax({
      type: 'POST',   
      url: 'plugins/eibd/core/ajax/eibd.ajax.php',
      data:
      {
          action: 'getTemplate',
          template:$(this).val()
      },
      dataType: 'json',
      global: true,
      error: function(request, status, error) {},
      success: function(data) {
          var cmdindex = 0;
          $.each(data.result.cmd,function(index, value){
              var isExist = false;
              if(typeof value.SameCmd != "undefined") {
                  cmds.find('.CmdEqLogicTemplateAttr[data-l2key=SameCmd]').each(function(){
                      if($(this).val() == value.SameCmd){
                          isExist = true;
                          return;
                      }
                  });							
              }
              if(isExist == false){
                  var cmd = $('<div class="form-group">');
                  if(typeof  value.SameCmd == 'undefined'){
                      cmd.append($('<label class="col-md-5 control-label" >')
                          .text(value.name + " (DPT: " + value.configuration.KnxObjectType + ")"));
                  }else{
                      cmd.append($('<label class="col-md-5 control-label" >')
                          .text(value.SameCmd + " (DPT: " + value.configuration.KnxObjectType + ")"));
                  }
                  cmd.append(addCmdEqLogicTemplateAttr(cmdindex,value));
                  cmds.append(cmd);
                  cmdindex++;
              }
          });
          $.each(data.result.options,function(id, options){
              if(typeof options.type == "undefined") {
                  cmds.append($('<div class="form-group">')
                      .append($('<label class="col-md-5 control-label" >')
                          .text(options.name))
                      .append($('<div class="col-md-5">')
                          .append($('<input type="checkbox" class="TemplateOption" data-l1key="'+id+'">'))));
                  $.each(options.cmd,function(index, value){
                      var isExist = false;
                      if(typeof value.SameCmd != "undefined") {
                          cmds.find('.CmdEqLogicTemplateAttr[data-l2key=SameCmd]').each(function(){
                              if($(this).val() == value.SameCmd){
                                  isExist = true;
                                  return;
                              }
                          });							
                      }
                      if(isExist == false){
                          var cmd = $('<div class="form-group '+id+'">');
                          if(typeof  value.SameCmd == 'undefined'){
                              cmd.append($('<label class="col-md-5 control-label" >')
                                  .text(value.name + " (DPT: " + value.configuration.KnxObjectType + ")"));
                          }else{
                              cmd.append($('<label class="col-md-5 control-label" >')
                                  .text(value.SameCmd + " (DPT: " + value.configuration.KnxObjectType + ")"));
                          }
                          cmd.append(addCmdEqLogicTemplateAttr(cmdindex,value));
                          cmds.append(cmd.hide());
                          cmdindex++;
                      }
                  });
                  $('.TemplateOption[data-l1key='+id+']').off().on('change',function(){
                      if($(this).is(':checked'))
                          $('.'+$(this).attr('data-l1key')).show();
                      else
                          $('.'+$(this).attr('data-l1key')).hide();
                  });
              }else{
                  _optionsMultiple=options;
                  if(options.type == "eqLogic"){
                      cmds.find('.option_bt').append(addBtOptionTemplate(id,options.name));
                  }
                  if(options.type == "cmd"){
                      cmds.find('.option_bt').append(addBtOptionTemplate(id,options.name));
                  }
              }
          });
      }
  });
});
function addBtOptionTemplate(id,name){
  var html = $('<div class="input-group pull-right" style="display:inline-flex">')
      .append($('<span class="input-group-btn">')
          .append($('<a class="btn btn-warning btn-xs roundedRight bt_addOptionTemplate" data-cmd-id="'+id+'" >')
              .append($('<i class="fas fa-plus-circle">'))
              .text(name)));
  
  $('body').off('click','.bt_addOptionTemplate').on('click','.bt_addOptionTemplate',function(){
      if(_optionsMultiple.type == "eqLogic"){
          TemplateDialog('newEqLogic',_optionsMultiple.template);
      }
      if(_optionsMultiple.type == "cmd"){
          var cmds=$(this).closest('.bootbox-body').find('.CmdsTempates')
          
              //if($(this).attr('data-cmd-id') == index)
              addCmdTemplate(cmds);
      }
  });
  return html;
}
function addCmdTemplate(cmds){
  bootbox.dialog({
      title: "{{Nom de la nouvelle commande}}",
      message: $('<div>').append($('<input class="form-control input-sm" data-l1key="name">')),
      buttons: {
          "Annuler": {
              className: "btn-default",
              callback: function () {
                  //el.atCaret('insert', result.human);
              }
          },
          success: {
              label: "Valider",
              className: "btn-primary",
              callback: function () {
                  var optionHtml = $('<div class="'+_optionsMultiple.tag+'">');
                  var name = $(this).find('input[data-l1key=name]').val();
                  $.each(_optionsMultiple.cmd,function(index, value){
                      value.name = name;
                      var cmd = $('<div class="form-group '+index+'">');
                      if(typeof  value.SameCmd == 'undefined'){
                          cmd.append($('<label class="col-md-5 control-label" >')
                              .text(value.name + " (DPT: " + value.configuration.KnxObjectType + ")"));
                      }else{
                          cmd.append($('<label class="col-md-5 control-label" >')
                              .text(value.SameCmd + " (DPT: " + value.configuration.KnxObjectType + ")"));
                      }
                      cmd.append(addCmdEqLogicTemplateAttr(index,value));
                      optionHtml.append(cmd);
                  });
                  cmds.append(optionHtml);
              }
          },
      }
  });
}
function addCmdEqLogicTemplateAttr(index,value){
  return $('<div class="col-md-5">')
      .append($('<div class="input-group">')
          .append($('<input type="hidden" class="CmdEqLogicTemplateAttr form-control input-sm" data-l1key="'+index+'" data-l2key="name">')
              .val(value.name))
          .append($('<input type="hidden" class="CmdEqLogicTemplateAttr form-control input-sm" data-l1key="'+index+'" data-l2key="SameCmd">')
              .val(value.SameCmd))
          .append($('<input type="hidden" class="CmdEqLogicTemplateAttr form-control input-sm" data-l1key="'+index+'" data-l2key="KnxObjectType">')
              .val(value.configuration.KnxObjectType)))
      .append($('<div class="input-group">')
          .append($('<input class="CmdEqLogicTemplateAttr form-control input-sm" data-l1key="'+index+'" data-l2key="logicalId">'))
          .append($('<span class="input-group-btn">')
              .append($('<a class="btn btn-success btn-sm bt_selectGadInconnue">')
                  .append($('<i class="fa fa-list-alt">')))));
}
