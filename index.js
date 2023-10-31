// ==UserScript==
// @name         好医生-视频一键到底与自动答题
// @namespace    https://dev.limkim.xyz/
// @version      1.1.4
// @description  好医生继续医学教育视频一键看完(含北京市继续医学教育必修课培训), 并且支持考试自动完成
// @author       limkim
// @match        *://cme.haoyisheng.com/cme/polyv.jsp*
// @match        *://cme.haoyisheng.com/cme/study2.jsp*
// @match        *://cme.haoyisheng.com/cme/exam.jsp*
// @match        *://cme.haoyisheng.com/cme/examQuizFail.jsp*
// @match        *://bjsqypx.haoyisheng.com/qypx/bj/polyv.jsp*
// @match        *://www.cmechina.net/cme/polyv.jsp*
// @match        *://www.cmechina.net/cme/study2.jsp*
// @match        *://www.cmechina.net/cme/exam.jsp*
// @match        *://www.cmechina.net/cme/examQuizFail.jsp*
// @match        *://hb.cmechina.net/cme/polyv.jsp*
// @match        *://hb.cmechina.net/cme/study2.jsp*
// @match        *://hb.cmechina.net/cme/exam.jsp*
// @match        *://hb.cmechina.net/cme/examQuizFail.jsp*
// @license MIT

// @icon         https://dev.limkim.xyz/favicon.ico
// @run-at       document-end
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_openInTab
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// ==/UserScript==


(function () {
    'use strict';
    // 获取本地存储的正确答案对象
    const getAnswerObject = () => {
        const answerObject = localStorage.getItem('right_answer_obj') || '{}';
        return JSON.parse(answerObject);
    };
    const buttonCssText = 'position: absolute;z-index: 99999;top: -40px;right: 0;padding:10px;cursor:pointer;background-color: #3087d9;color: #fff;box-shadow: 0px 0px 12px rgba(0, 0, 0, .12);';
    // 考试结果页面进行遍历, 得到正确答案
    if (window.location.pathname.includes('examQuizFail')) {
        // 获取下一个选项
        const getNextChoice = str => {
            const code = str.charCodeAt(0) + 1;
            if (code === 70) {
                alert('全部遍历但未找到正确答案, 请确定是使用脚本按钮开始答题!');
                return 'A';
            }
            return String.fromCharCode(code);
        };
        // 循环多选选项
        const getNextMultipleChoice = str => {
            const dic = ['ABCDE', 'ABCD', 'ABD', 'ABC', 'AB', 'A'];
            const index = dic.indexOf(str);
            if (index === 5) {
                alert('全部遍历但未找到正确答案, 请确定是使用脚本按钮开始答题!');
                return 'ABCDE';
            }
            return dic[index + 1];
        };
        const nowAnswerStr = window.location.search.split('ansList=')[1].split('&')[0];
        const nowAnswerList = window.location.search.split('ansList=')[1].split('&')[0].split(',');
        const h3List = document.querySelectorAll('.answer_list h3');
        let finished = true;
        for (let i = 0; i < 5; i++) {
            if (h3List[i].className === 'cuo') {
                finished = false;
                if (nowAnswerList[i].length === 1) {
                    nowAnswerList[i] = getNextChoice(nowAnswerList[i]);
                } else {
                    nowAnswerList[i] = getNextMultipleChoice(nowAnswerList[i]);
                }
                window.location.href = window.location.href.replace(nowAnswerStr, nowAnswerList.join(','));
                break;
            }
        }
        if (finished) {
            const examId = window.location.search.split('course_id=')[1].split('&')[0] + '_' + window.location.search.split('paper_id=')[1].split('&')[0];
            const answerObject = getAnswerObject();
            answerObject[examId] = nowAnswerList;
            localStorage.setItem('right_answer_obj', JSON.stringify(answerObject));
            history.go(-1);
        }
        return;
    }
    // 考试页面填写初始答案和正确答案,并提交
    if (window.location.pathname.includes('exam')) {
        const examId = window.location.search.split('course_id=')[1].split('&')[0] + '_' + window.location.search.split('paper_id=')[1].split('&')[0];
        const answerObject = getAnswerObject();
        const autoSelectAnswer = answerArray => {
            const liList = document.querySelectorAll('.exam_list li');
            for (let i = 0; i < 5; i++) {
                const LiChildren = liList[i].children;
                const answer = answerArray[i];
                for (let i = 0; i < LiChildren.length; i++) {
                    if (LiChildren[i].nodeName === 'P') {
                        const input = LiChildren[i].children[0];
                        if (answer.includes(input.value)) {
                            input.dispatchEvent(new MouseEvent('click'));
                            if (LiChildren[0].innerText.includes('单选')) { break; }
                        }
                    }
                }
            }
        };
        // 得到正确答案返回后, 直接填写并提交
        if (answerObject[examId]) {
            autoSelectAnswer(answerObject[examId]);
            return document.querySelector('#tjkj').dispatchEvent(new MouseEvent('click'));
        }

        const examSkipButton = document.createElement('button');

        examSkipButton.innerText = '考试? 拿来吧你!';
        examSkipButton.id = 'exam_skip_btn';
        examSkipButton.style.cssText = buttonCssText;
        examSkipButton.style.top = '55px';
        examSkipButton.style.right = '150px';

        examSkipButton.addEventListener('click', () => {
            // 多选全选, 单选选A
            autoSelectAnswer(['ABCDE', 'ABCDE', 'ABCDE', 'ABCDE', 'ABCDE']);
            document.querySelector('#tjkj').dispatchEvent(new MouseEvent('click'));
        });

        document.querySelector('.main').appendChild(examSkipButton);

        if (localStorage.getItem('script_auto_exam') === 'true') {
            examSkipButton.dispatchEvent(new MouseEvent('click'));
        }
        return;
    }
    // 视频跳过
    setTimeout(() => {
        const video = document.querySelector('.pv-video') || document.querySelector('video');
        const parent = video.parentElement;
        const videoSkipButton = document.createElement('button');
        const selecterLabel = document.createElement('label');
        const playRateSelecter = document.createElement('select');
        const checkboxContainer = document.createElement('div');
        const videoCheckboxLabel = document.createElement('label');
        const videoCheckbox = document.createElement('input');
        const examCheckboxLabel = document.createElement('label');
        const examCheckbox = document.createElement('input');

        const containerCssText = 'position: absolute;height: 37px;line-height: 37px;top: -40px;right: 130px;';
        const labelCssText = 'vertical-align: middle;margin-right: 5px;line-height: 37px;color: #3087d9;font-size: 15px;';
        const controllerCssText = 'vertical-align: middle;cursor: pointer; margin-right: 5px;';
        videoSkipButton.innerText = '看视频? 拿来吧你!';
        videoSkipButton.style.cssText = buttonCssText;
        checkboxContainer.style.cssText = containerCssText;
        videoCheckboxLabel.innerText = '自动看完:';
        videoCheckboxLabel.style.cssText = labelCssText;
        videoCheckbox.type = 'checkbox';
        videoCheckbox.style.cssText = controllerCssText;
        examCheckboxLabel.innerText = '进入考试后自动开考:';
        examCheckboxLabel.style.cssText = labelCssText;
        examCheckbox.type = 'checkbox';
        examCheckbox.style.cssText = controllerCssText;
        selecterLabel.innerText = '倍速:';
        selecterLabel.style.cssText = labelCssText;
        playRateSelecter.style.cssText = controllerCssText;
        playRateSelecter.style.border = '1px solid #000';
        // 倍速选择器初始化选项
        for (let i = 1; i <= 15; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.label = i;
            playRateSelecter.appendChild(option);
        }

        playRateSelecter.addEventListener('change', () => {
            video.playbackRate = parseInt(playRateSelecter.value);
            localStorage.setItem('play_back_rate', playRateSelecter.value);
        });
        videoCheckbox.addEventListener('change', e => {
            const autoVlaue = e.target.checked;
            localStorage.setItem('script_auto_skip', JSON.stringify(autoVlaue));
        });
        examCheckbox.addEventListener('change', e => {
            const autoVlaue = e.target.checked;
            localStorage.setItem('script_auto_exam', JSON.stringify(autoVlaue));
        });
        videoSkipButton.addEventListener('click', () => {
            video.volume = 0;
            video.playbackRate = parseInt(playRateSelecter.value);
            video.play();
            video.currentTime = video.duration;
        });

        if (document.querySelector('.content .h5')) {
            document.querySelector('.content .h5').style.marginBottom = '50px';
            checkboxContainer.style.top = '-45px';
            videoSkipButton.style.top = '-45px';
            videoSkipButton.style.border = 'none';
        }
        if (document.querySelector('.ccH5playerBox')) {
            document.querySelector('.ccH5playerBox').style.overflow = 'visible';
        }

        checkboxContainer.append(examCheckboxLabel, examCheckbox, videoCheckboxLabel, videoCheckbox, selecterLabel, playRateSelecter);
        parent.append(checkboxContainer, videoSkipButton);

        if (localStorage.getItem('script_auto_skip') === 'true') {
            videoCheckbox.checked = true;
            videoSkipButton.dispatchEvent(new MouseEvent('click'));
        }
        if (localStorage.getItem('script_auto_exam') === 'true') {
            examCheckbox.checked = true;
        }

        const localRate = localStorage.getItem('play_back_rate');
        if (localRate && parseInt(localRate) !== NaN && parseInt(localRate) >= 1 && parseInt(localRate) <= 15) {
            playRateSelecter.value = localRate;
            video.playbackRate = parseInt(localRate);
        } else {
            playRateSelecter.value = '10';
            video.playbackRate = 10;
        }
    }, 1000);
})();
