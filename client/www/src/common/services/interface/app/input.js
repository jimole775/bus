/**
 * Created by Andy on 2017/2/13.
 */
$ (document).ready (function () {

	var win = window;
	var callbackMap = {};
	win.appService = win.appService ? win.appService : {};

	//传入回调函数，绑定随机ID，ID号通过服务器转发
	win.appService.generateCallbackId = function (callback) {
		var callbackFunc = callback || function () {};
		var randomID = "callbackId" + parseInt((Math.random() * 1000000).toFixed(), 10);
		callbackMap[randomID] = callbackFunc;       //以randomID为键，绑定回调函数
		return randomID;
	};

	//通过服务器传送回来ID号，匹配callbackMap里的回调函数；
	win.appService.getCallbackById = function (callbackId) {
		var callback = callbackMap[callbackId];
		callbackMap[callbackId] = null;
		return callback;
	};

	var interActiveState = {};
	interActiveState.init = {};
	interActiveState.process = {};
	interActiveState.end = {};
	interActiveState.event = {};        //通过事件进行动态交互;

	win.jsRecvAppData = function (action, recvData, callbackId)                    //业务开始入口，由APP调用发起；
	{
		//如果callbackId匹配到相应的callbackId字串，就是JS主动请求信息，直接调用回调就OK
		//否则，都是APP主动推送信息
		//不过需要注意的是，不能在远程机器上运行这个代码
		if(callbackId.match(/callbackId/) && global.businessInfo.ID != 2){
			win.appService.getCallbackById(callbackId)(recvData);
			return;
		}
		
		switch (parseFloat (action)) {
			case win.CONSTANT.APP_TO_JS.RECEIVE_SCREEN_INFO:                                //获取屏幕尺寸,改变相应的字体大小
				interActiveState.init.getScreenInfo (recvData);
				break;
			case win.CONSTANT.APP_TO_JS.RECEIVE_KEYBOARD_INFO:                              //获取键盘尺寸信息,调整input框位置
				interActiveState.init.getKeyboardInfo (recvData);
				break;
			case win.CONSTANT.APP_TO_JS.RECEIVE_LOG_MESSAGE:                                //打印一条记录
				interActiveState.process.log (recvData);
				break;
			case win.CONSTANT.APP_TO_JS.RECEIVE_STATUS_MESSAGE:                             //状态消息
				interActiveState.process.statusMsg (recvData);
				break;
			case win.CONSTANT.APP_TO_JS.RECEIVE_DEV_INIT_STATUS:                            //设备准备就绪，接下来发送C09B给设备,开始业务了
				interActiveState.process.startBusiness ();
				break;
			case win.CONSTANT.APP_TO_JS.RECEIVE_SIGN_FOR_CLOSE_UI:                          //直接关闭窗口
				interActiveState.end.close ();
				break;
			case win.CONSTANT.APP_TO_JS.RECEIVE_APP_ERR_MSG:                                //处理异常，执行退出流程
			case win.CONSTANT.APP_TO_JS.RECEIVE_DEV_CONNECT_FAIL:                           //设备连接失败
				interActiveState.end.err (recvData);
				break;
			//case win.CONSTANT.APP_TO_JS.RECEIVE_IMAGE_URL:                                      //获取车型图片URL
			//	interActiveState.event.handleImages (recvData);
			//	break;
			case win.CONSTANT.APP_TO_JS.RECEIVE_QUIT_SIGN_AFTER_DTC_LOG:                    //APP处理完上传故障码日志之后，通过此端口执行3109FF退出操作；
			case win.CONSTANT.APP_TO_JS.RECEIVE_QUIT_SIGN_NORMAL:                           //退出业务之前，先通知APP其他线程的收尾工作，再通过此端口执行3109FF退出操作；
				interActiveState.end.quit ();
				break;
			case win.CONSTANT.APP_TO_JS.RECEIVE_DEV_FILE_AT_A100:                           //处理A100个性设码6202指令成功时，接收来自APP解析出来的DEV文件名；
				interActiveState.event.handleA100Program(recvData);
				break;
			case win.CONSTANT.APP_TO_JS.RECEIVE_CALC_MD5_RESULT:                            //编程设码项目 A040,A05C,A08D项目通过APP端口来执行处理回调；
			case win.CONSTANT.APP_TO_JS.RECEIVE_DIR_ALL_FILES:                              //编程设码项目 A040,A05C,A08D项目通过APP端口来执行处理回调；
			case win.CONSTANT.APP_TO_JS.RECEIVE_UPLOAD_FILE_FROM_SERVER:                    //编程设码项目 A040,A05C,A08D项目通过APP端口来执行处理回调；
				interActiveState.event.handleProgramSeriesEvent(recvData, callbackId);
				break;
		}
	};


	interActiveState.end.quit = function () {
		win.sendDataToDev ("3109FF");
	};
	interActiveState.end.close = function () {
		win.appService.sendDataToApp (3999, "", "");
	};
	interActiveState.end.err = function (recvData) {
		var msg = recvData + "，点击确定之后退出";
		$ ("#RMTCover").hide ();
		tool.alert (msg, function () {
			tool.loading ({text: "正在退出业务..."});
			//加延迟：用于解决3999强制退出时，JS停止运行导致画面假死的问题
			setTimeout (function () {
				win.appService.sendDataToApp (3999, "", "");
			}, 150);

		});
	};

	interActiveState.process.log = function (recvData) {
		var logstatus = document.getElementById("ShowMessage").style.display;
		if(logstatus === "none"){
			$ ("#Title").html (win.global.businessInfo.procedureType);
			$ ("#vehicleType").html ("【" + win.global.businessInfo.carName_cn + "(" + win.global.businessInfo.carType + ")】");

			$ ("#businessType").html ((function(){
				var carTypeRoot = "";
				for(var item in win.global.rootCache.carType){
					if(win.global.rootCache.carType.hasOwnProperty(item)){
						carTypeRoot += win.global.rootCache.carType[item] + "/";
					}
				}
				return carTypeRoot.substring(0,carTypeRoot.length-1);   //去掉最后一个"/"
			})());

			document.getElementById("ShowMessage").style.display = "block";
			document.getElementById("bottomButton").style.width = "0";
			document.getElementById("footer").style.width = "100%";
		}

		if (/主程序版本/g.test (recvData)) {                                         //截取主程序版本信息；
			var startIndex = recvData.indexOf (":");
			$ ("#appVersion").html (recvData.substring (startIndex + 1, recvData.length));
		}
		else if (/服务器名称/g.test (recvData)) {                                    //截取服务器信息；
			var startIndex = recvData.indexOf (":");
			$ ("#serverType").html (recvData.substring (startIndex + 1, recvData.length));
		}
		else {
			tool.log (recvData);
		}
	};
	interActiveState.process.statusMsg = function (recvData) {
		tool.processBar (recvData);
	};

	interActiveState.process.startBusiness = function () {
		win.sendDataToDev ("C09B");
	};

	/**
	 * 根据APP计算的屏幕物理尺寸，修改文本大小
	 * @param recvData = {screen:"",head:"",foot:""}
	 * screen:5 //屏幕的物理尺寸，单位（inch）;
	 * head:40  //头部的高度，单位（px）;
	 * foot:40  //脚部的高度，单位（px）;
	 * */
	interActiveState.init.getScreenInfo = function (recvData) {
		console.log("手机屏幕信息：",recvData);
		var json = typeof recvData === "string" ? JSON.parse(recvData) : recvData;
		var docEl = document.documentElement;

		var screenSize = json.screen;
		if (screenSize >= 7) docEl.style.fontSize = '90%';
		else if (screenSize > 4.4 && screenSize < 7) docEl.style.fontSize = '70%';
		else docEl.style.fontSize = '50%';

		//根据项目需求，头部和脚部高度需要和APP首页相同
		$(".title")[0].style.height = json.head + "px";
		$("#footer")[0].style.height = json.foot + "px";
		$("#bottomButton")[0].style.height = json.foot + "px";


		setTimeout(function(){
			tool.layoutTable(); //重新计算页面的布局,会导致页面重绘
			setTimeout(function(){
				tool._scroll.init ();   //重新计算滚动的布局
			},45);
		},210);  //这个延迟取决于页面重绘的速度!

		//把屏幕尺寸辐射到全局
		win.global.phoneScreenSize = screenSize;
	};

	interActiveState.init.getKeyboardInfo = function (keyboardHeight) {
		win.global.keyBoardHeight = parseFloat (keyboardHeight);
	};

	/**
	 *获取图片的信息
	 */
	//interActiveState.event.handleImages = function (recvData) {
	//	var json = typeof recvData === "string" && /\{\[/.test (recvData) ? JSON.parse (recvData) : recvData;
	//	var url = json[0];
	//	var param = json[1];
	//	global.ShowCarTypeImg (url, param);
	//};

	interActiveState.event.handleProgramSeriesEvent = function(action, recvData){
		tool.loading (0);
		var json = typeof recvData === "string" ?
			( /[\{\[]/.test (recvData.substr (0, 5)) ? JSON.parse (recvData) : recvData ) : recvData;
		var FunPrev = "handleAppCallback" + action;
		var func = win.global[FunPrev];
		if (func && typeof func === "function") func (json);
		console.log ("programming:", recvData);
	};

	interActiveState.event.handleA100Program = function(recvData){
		if (global.A100GetDevFileName)global.A100GetDevFileName (recvData);
		console.log ("设备文件名：", recvData);
	};


});