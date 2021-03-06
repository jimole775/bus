/**
 * Created by Andy on 2017/1/5.
 */
(function() {
	document.getElementById("processBlock").innerHTML += [
		'<div ng-controller="ComponentTestCtrl">',
		'<div id="componentTest" class="data-box">',
		'<div class="scroll-table-header">',
		'<div class="groupNav">',
		'<button class="item-button padding-when-without-inner-class" ng-click="createDropDownList()">',
		'<span class="item-description">元件分组</span>',
		'<i class="arrow-right"></i>',
		'<span class="item-value" ng-class="{\'subordination-text\':curGroupName.match(\'无分组\')}" ng-bind="curGroupName"></span>',
		'</button>',
		'</div>',
		'</div>',
		'<div class="scroll-table-body">',
		'<table>',
		'<thead>',
		'<tr>',
		'<th width="50%">元件或者动作</th>',
		'<th width="50%">状态</th>',
		'</tr>',
		'</thead>',
		'<tbody>',
		'<tr ng-repeat="item in Components" ng-click="rawClick(item,$index)">',
		'<td ng-bind="item.name"></td>',
		'<td ng-class="[\'subordination-text\',{\'light-text\':(!item.state.match(\'未知状态\') && !item.state.match(\'失败\')),\'warn-text\':item.state.match(\'失败\')}]"',
		' style="text-align: center" ng-bind="item.state">',
		'</td>',
		'</tr>',
		'</tbody>',
		'</table>',
		'</div>',
		'</div>',
		//<!--在基础页面之上的弹框-->
		'<div class="box tip-box-wide alert-box" id="componentTestPopBox">',
		'<h1 class="box-title">提示</h1>',
		'<div>',
		'<p class="box-p" ng-repeat="item in danwei">',
		'<b ng-bind="item">请选择</b>',
		'</p>',
		'<p class="warn-text box-p" ng-show="isErr">',
		'<em ng-bind="isErr"></em>',
		'</p>',
		'<p class="box-p" ng-show="popBoxType.value">',
		'<label>',
		'<input id="input_value" ng-model="input_value" ng-disabled="execButtonSate === \'working\'" type="text">',
		'</label>',
		'</p>',
		'<div ng-show="popBoxType.checked">',
		'<button class="item-button animation" ng-repeat="item in fomulaname_Ary"',
		' ng-hide="(item.fomula == \'0005\' || item.fomula == \'0006\') && (item.name === \'退出\' || item.name === \'EXIT\')"',
		' ng-class="{\'event-disable\':execButtonSate === \'working\'}"',
		' ng-click="ComponentTestPopBoxRMTCheckedHandle($index, item.checked)">',
		'<b class="item-description item-description-layout-table">',
		'<span class="item-description-layout-cell">{{ item.name }}</span>',
		'</b>',
		'<b class="item-value-layout-table" style="text-align: center">',
		'<span class="item-value-layout-cell">',
		'<label ng-class="{\'radioBox\':!item.checked,\'radioBox-new\':item.checked}">',
		'<input type="radio" name="componentTestPopBoxRadio" ng-model="item.checked"/>',
		'<i></i>',
		'</label>',
		'</span>',
		'</b>',
		'</button>',
		'</div>',
		'</div>',
		'<div class="bottom-bar-button-box">',
		'<button type="button" class="bottom-bar-button bottom-bar-button2" id="exeComponentTest"',
		'ng-class="{\'event-disable\':execButtonSate === \'working\',\'button-disable\':execButtonSate === \'working\'}"',
		'ng-bind="execText">测试',
		'</button>',
		'<button type="button" class="bottom-bar-button bottom-bar-button2" id="quitComponentTest">退出</button>',
		'</div>',
		'</div>',
		'</div>'
	].join ("");
})();