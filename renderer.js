const fs = require('fs-extra'),
    urlParser = require('js-video-url-parser'),
    ytdl = require('ytdl-core'),
    path = require('path'),
    os = require('os'),
    electron = require('electron'),
    config = require('./config.json'),
    ipc = electron.ipcRenderer,
    clipboard = electron.clipboard,
    remote = electron.remote,
    dialog = remote.dialog;

let oinput = document.getElementById('down__url'),
    oBtn = document.getElementById('down__down'),
    oDown = document.getElementById('down'),
    oProgram = document.getElementById('down__program'),
    oProgramText = document.getElementById('down__programText'),
    oProgramBar = document.getElementById('down__programBar'),
    oCose = document.getElementById('topBar__cose'),
    oBack = document.getElementById('down__back'),
    otitle = document.getElementById('topBar__title'),
    down = (url)=>{
        let obj = urlParser.parse(url);

        if(typeof obj === 'object' && obj.provider === 'youtube'){
            let u = urlParser.create({
                videoInfo:obj,
                format:'short'
            }),
            dist = config.distPath === '' ? path.join(os.homedir(),'Desktop',`${obj.id}.mp4`) : path.join(config.distPath,`${obj.id}.mp4`),
            distDir = path.dirname(dist),
            totalSize = 0,
            downloadedSize = 0
            lastProgress = 0,
            download = ytdl(u),
            index = 0,
            temp = setInterval(()=>{
                let s = (()=>{
                    let t = '';
                    for(let i=0,len=index;i<len;i++){
                        t+='.'
                    };
                    return t;
                })();
                oProgramText.innerHTML = `Parsing ${s}`;
                index++;
                if(index >= 6){
                    index = 0;
                };
            },200);

            oProgramText.innerHTML = `Parsing ...`;

            
            //等待
            oDown.className = 'down down--ing';
            
            oProgramBar.style.width = '0';

            download.on("response", (res) => {
                clearInterval(temp);
                totalSize = parseFloat(res.headers["content-length"], 10);

                //进度条显示
                oProgramText.innerHTML = `Total Size:${totalSize}kb`;
                oDown.className = 'down down--ing';
            });

            download.on("data", data => {
                clearInterval(temp);
                downloadedSize += data.length;
                lastProgress = Math.max(downloadedSize / totalSize, lastProgress);

                //进度条显示进度
                if(totalSize === 0){
                    oProgramText.innerHTML = `Downloading:${downloadedSize}kb`;
                }else{
                    oProgramBar.style.width = `${lastProgress * 100}%`;
                    oProgramText.innerHTML = `Downloading:${totalSize}kb / ${downloadedSize}kb`;
                }; 
            });
            download.on("finish",()=>{
                //下载完成弹出下载框
                dialog.showMessageBox(null,{
                    type:'info',
                    title:'Success',
                    message:`Download completed`,
                    detail:`${dist}`
                });

                //清空表单值并设置其样式
                oinput.value = '';
                oDown.className = 'down';
            });
            download.on("error", ()=>{
                oDown.className = 'down down--error';
                oProgramText.innerHTML = 'Download error';
            });

            //创建目录
            fs.ensureDirSync(distDir);
            download.pipe(fs.createWriteStream(dist));
        }else{
            dialog.showMessageBox(null,{
                type:'error',
                title:'Error：',
                message:`Not a valid Youtube url`,
                detail:`${url}`
            });
        };
    };


//错误返回按钮
oBack.onclick = function(){
    oinput.value = '';
    oDown.className = 'down';
};

//三击title选择保存目录
otitle.onclick = function(){
    const _ts = this;
    clearTimeout(_ts.clickTemp);
    _ts.clickNumber = _ts.clickNumber === undefined ? 0 : _ts.clickNumber+1;

    if(_ts.clickNumber > 2){
        let distPath = dialog.showOpenDialog(null,{
            title:'Choose to save the directory',
            defaultPath:path.join(os.homedir(),'Desktop'),
            buttonLabel:'Select',
            properties:['openDirectory','createDirectory']
        });

        if(distPath){
            config.distPath = distPath[0];
            let configString = JSON.stringify(config,null,2);

            //更新保存路径到配置文件
            fs.writeFileSync(path.join('.','config.json'),configString);
        };
    };

    _ts.clickTemp = setTimeout(function(){
        _ts.clickNumber = undefined;
    },500);
};

//按钮点击下载
oBtn.onclick = function(){
    let url = oinput.value;
    down(url);
};

//链接输入值改变监听
let inputWatch = function(){
    let val = oinput.value;

    if(val === ''){
        oBtn.className = 'down__down down__down--disabled';
    }else{
        oBtn.className = 'down__down';
    };
}
oinput.oninput = inputWatch;

//监听按钮
ipc.send('keydown', '监听按键');

//粘贴
ipc.on('paste',(event,arr)=>{
    //clipboard.writeText('Example String')
    let text = clipboard.readText();
    oinput.value = text;
    inputWatch();
});

//全选
ipc.on('selectAll',(event,arr)=>{
    oinput.select();
});

//点击按钮关闭窗口
oCose.onclick = function(){
    console.log('关闭')
    ipc.send('window-close')
    // var window = remote.getCurrentWindow();
    //    window.close();
    // console.log(ipc);
    // ipc.sendSync('window-close');
    // console.log('关闭');
};
