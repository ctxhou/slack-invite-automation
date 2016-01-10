var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');

router.get('/', function(req, res) {
  res.render('index', { community: config.community,
                        tokenRequired: !!config.inviteToken });
});

router.post('/invite', function(req, res) {
  if (req.body.email && (!config.inviteToken || (!!config.inviteToken && req.body.token === config.inviteToken))) {
    request.post({
        url: 'https://'+ config.slackUrl + '/api/users.admin.invite',
        form: {
          email: req.body.email,
          token: config.slacktoken,
          set_active: true
        }
      }, function(err, httpResponse, body) {
        // body looks like:
        //   {"ok":true}
        //       or
        //   {"ok":false,"error":"already_invited"}
        if (err) { return res.send('Error:' + err); }
        body = JSON.parse(body);
        if (body.ok) {
          res.render('result', {
            community: config.community,
            message: '成功! 快去你的信箱 "'+ req.body.email +'" 收邀請信吧！'
          });
        } else {
          var error = body.error;
          if (error === 'already_invited' || error === 'already_in_team') {
            res.render('result', {
              community: config.community,
              message: '成功! 你已經被邀請過了.<br>' +
                       '歡迎直接到slack頻道 → <a href="https://'+ config.slackUrl +'">'+ config.community +'</a>'
            });
            return;
          } else if (error === 'invalid_email') {
            error = '很抱歉，你輸入的Email並非正確的格式'
          } else if (error === 'invalid_auth') {
            error = '抱歉，我們出了一點問題，請麻煩你通知系統管理員'
          }

          res.render('result', {
            community: config.community,
            message: 'Failed! ' + error,
            isFailed: true
          });
        }
      });
  } else {
    var errMsg = [];
    if (!req.body.email) {
      errMsg.push('your email is required');
    }

    if (!!config.inviteToken) {
      if (!req.body.token) {
        errMsg.push('valid token is required');
      }

      if (req.body.token && req.body.token !== config.inviteToken) {
        errMsg.push('the token you entered is wrong');
      }
    }

    res.render('result', {
      community: config.community,
      message: 'Failed! ' + errMsg.join(' and ') + '.',
      isFailed: true
    });
  }
});

module.exports = router;
