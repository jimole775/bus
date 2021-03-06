/**
 * Created by Administrator on 2015/8/21.
 */
(function () {
	var win = window;
	var showView = false;
	var getOrignal = false;
	var cacheChannel = 0;
	var gPidLen = 0;
	var finished = false;
	App.controller('TcpBaseAdjusterCtrl', ['$scope', 'angularFactory', function ($scope, angularFactory) {
		var safeApply = angularFactory.getScope($scope).safeApply;

		$scope.baseAdjuseterDataList = [];
		$scope.stateText = "开始";

		/**
		 * 大众基本调整入口
		 * @param value 通道号
		 */
		win.moduleEntry.adjuster = function (value) {
			showView = true;
			getOrignal = false;
			$scope.stateText = "开始";
			cacheChannel = tool.toHex(value, 8);
			document.getElementById("Title").innerText = "TCP大众基本调整";
			win.devService.sendDataToDev('310920' + cacheChannel);
			bindBottomBtn();
			tool.layout("baseadjuster", 1);
			safeApply(function () {
				$scope.isBtnBackEnable = false;
				$scope.isBtnOkEnable = false;
			});
		};

		win.devService.Fun710920 = function (varRecvData) {
			var count =
				tool.hex2dec(varRecvData.substr(6, 2));

			//获取到的数据项为0，就显示调整结束
			if (!count) {
				tool.alert("调整结束", function () {
					releaseButtonEvent_tcpBaseAdjust();
				});
				finished = true;
				return;
			}

			var DataPack = {
				dbfilename: global.businessInfo.dbFilename,
				pub: global.businessInfo.pubFilename,
				pids: []
			};

			if (getOrignal) {
				for (var i = 0; i < gPidLen; i++)
					DataPack.pids[i] = {
						originalX: varRecvData.substr(8 + count * 8 + i * 2, 2),
						originalY: varRecvData.substr(8 + count * 8 + i * 2 + count * 2, 2),
						pid: varRecvData.substr(8 + i * 8, 8)
					};

				DataPack.pids.unDuplicate("pid");
				getValue(angularFactory.replacePidToIndex(DataPack, $scope.baseAdjuseterDataList));
			}
			else {
				for (var j = 0; j < count; j++)
					DataPack.pids[j] = varRecvData.substr(8 + j * 8, 8);

				gPidLen = DataPack.pids.length;
				DataPack.pids.unDuplicate();
				getBaseAdjustSupport(DataPack);
			}
		};

		win.devService.Fun7109A0 = function (varRecvData) {

			var i = $scope.baseAdjuseterDataList.length;
			if (i)
				while (i--) {
					$scope.baseAdjuseterDataList[i].ans = 'N/A';
				}

			tool.alert("调整失败", function () {
				tcpBaseAdjusterBack();
			});
			//tool.processBar('调整失败');
			safeApply(function () {});
		};

		function getBaseAdjustSupport(dataPack) {

			if (!showView) {
				$scope.isBtnBackEnable = true;
				return;
			}

			win.server.request(
				global.businessInfo.serverType,
				{
					key: "BASE_ADJUST_SUPPORT",
					cartype: global.businessInfo.carType
				},
				dataPack,
				win.server.addRetryFn(win.server.addCallbackParam(win.serverRequestCallback.BASE_ADJUST_SUPPORT, [dataPack]),
				[getBaseAdjustSupport, tcpBaseAdjusterBack])
			);
		}

		win.serverRequestCallback.BASE_ADJUST_SUPPORT = function (responseObject, params) {
			if (!showView)return;
			if (!responseObject.supportitems.length) {
				tool.alert('服务器无数据支持',
				           function () {
					           tcpBaseAdjusterBack();
				           }
				);
				return;
			}
			var supItems = responseObject.supportitems;
			var i = supItems.length;
			while (i--) supItems[i].show = true;

			$scope.baseAdjuseterDataList = supItems;
			$scope.isBtnOkEnable = true;
			$scope.isBtnBackEnable = true;
			releaseButtonEvent_tcpBaseAdjust();
			tool.layoutTable();
			safeApply(function () {});
		};

		function getValue(dataPack) {
			//发送数据到服务器
			if (!showView) {
				$scope.isBtnBackEnable = true;
				return;
			}

			win.server.request(
				global.businessInfo.serverType,
				{
					key: "BASE_ADJUST",
					cartype: global.businessInfo.carType
				},
				dataPack,
				win.server.addRetryFn(win.server.addCallbackParam(win.serverRequestCallback.BASE_ADJUST, [dataPack]),
				handleBadRequest)
			);

		}

		function handleBadRequest() {
			var i = $scope.baseAdjuseterDataList.length;
			safeApply(function () {
				while (i--) {
					$scope.baseAdjuseterDataList[i].ans = 'N/A';
				}
			});
		}

		win.serverRequestCallback.BASE_ADJUST = function (responseObject, params) {
			if (!showView)return;
			if (!responseObject.items.length) {
				//如果响应失败，就全部值更新为N/A
				var i = $scope.baseAdjuseterDataList.length;
				safeApply(function () {
					while (i--) {
						$scope.baseAdjuseterDataList[i].ans = 'N/A';
					}
				});
			}
			else {

				var data = $scope.baseAdjuseterDataList || [];
				var items = responseObject.items;
				var len = data.length;
				var j = len;
				while (j--) {
					var k = len;
					while (k--) {
						if (data[j].pid === items[k].pid) {
							data[j].ans = items[k].ans;
							break;
						}
					}
				}
			}
			safeApply(function () {});
			if (!finished && $scope.stateText == "暂停") win.devService.sendDataToDev('310920' + cacheChannel);

		};


		function bindBottomBtn() {
			win.tool.bottomBtn({
				btn1Text: function () {
					return $scope.stateText;
				},
				btn2Text: '返回',
				btn1Disable: function () {
					return $scope.isBtnOkEnable;
				},
				btn2Disable: function () {
					return $scope.isBtnBackEnable;
				},
				btn1Callback: function () {
					tcpBaseAdjusterConfirm();
				},
				btn2Callback: function () {
					tcpBaseAdjusterBack();
				}
			})
		}

		function releaseButtonEvent_tcpBaseAdjust() {
			safeApply(function () {
				$scope.stateText = '开始';
				$scope.isBtnBackEnable = true;
			});
		}

		function tcpBaseAdjusterConfirm() {

			if ($scope.stateText == '暂停') {
				safeApply(function () {
					showView = false;
					$scope.stateText = '继续';
					$scope.isBtnBackEnable = true;
				});
				return;
			}

			finished = false;
			getOrignal = true;
			showView = true;
			$scope.isBtnBackEnable = false;
			$scope.stateText = '暂停';
			win.devService.sendDataToDev('310920' + cacheChannel);
			safeApply(function () {});
		}

		function tcpBaseAdjusterBack() {
			showView = false;
			safeApply(function () {
				$scope.baseAdjuseterDataList.length = 0;
			});
			win.tool.loading(0);
			tool.layout("baseadjuster", 0);
			win.devService.sendDataToDev("310923");
			win.moduleEntry.showOperationMenu();
		}

	}]);

})();