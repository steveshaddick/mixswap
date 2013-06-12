var g = (function (me) {

	
	me.hasClassName = function(element, name)
	{
		return new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)").test(element.className);
	}
		
	me.addClassName = function(element, name)
	{
		 if (!g.hasClassName(element, name)) {
			element.className = element.className ? [element.className, name].join(' ') : name;
		  }
	}
		
	me.removeClassName = function(element, name)
	{
		if (g.hasClassName(element, name)) {
			var c = element.className;
			element.className = c.replace(new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)", "g"), "");
		}
	}
		
	me.removeElementById = function(id)
	{
		var element = document.getElementById(id);
		if (typeof element != 'undefined') {
			element.parentNode.removeChild(element);
		}
	}

	return me;
	
})(g || {});

function AJAX(url,_data,returnHandler)
{var data;var me=this;this.url=url;this.params=null;this.returnHandler=returnHandler;this.send=function()
{var xmlReq=null;if(window.XMLHttpRequest){xmlReq=new XMLHttpRequest();}else if(window.ActiveXObject){xmlReq=new ActiveXObject("Microsoft.XMLHTTP");}
if(xmlReq==null)return false;xmlReq.open('POST',this.url,true);if(typeof this.params!='undefined'){xmlReq.setRequestHeader("Content-type","application/x-www-form-urlencoded");}
xmlReq.onreadystatechange=function()
{switch(xmlReq.readyState)
{case 0:break;case 1:break;case 2:break;case 3:break;case 4:if(typeof me.returnHandler!='undefined'){me.returnHandler(xmlReq);}
break;default:break;}}
xmlReq.send(this.params);}
if(typeof _data!='undefined'){data=Array();this.params="";for(var key in _data)
{data.push(key+"="+_data[key]);}
this.params=data.join("&");}}

function Modal(_message,_buttons)
{var isButtons;if(typeof _buttons=='undefined'){isButtons=false;}else if(_isButtons==true){isButtons=true;}
var divBG=document.createElement('DIV');var divModal=document.createElement('DIV');this.closeModal=function()
{document.body.removeChild(divBG);}
divBG.setAttribute('id','divModalBG');divBG.style.position='absolute';divBG.style.top='0px';divBG.style.left='0px';divBG.style.height='100%';divBG.style.width='100%';divBG.style.zIndex='1000000';divBG.style.backgroundColor='rgba(0,0,0,0.75)';divModal.setAttribute('id','divModal');divModal.style.position='absolute';divModal.style.width='200px';divModal.style.height='100px';divModal.style.padding='10px';divModal.style.left='50%';divModal.style.top='50%';divModal.style.marginLeft='-100px';divModal.style.marginTop='-50px';divModal.style.background='#FFF';divModal.innerHTML=_message;divBG.appendChild(divModal);document.body.insertBefore(divBG,document.body.firstChild);}// JavaScript Document