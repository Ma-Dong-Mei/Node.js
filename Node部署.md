# Node部署

在 CentOS 7 下部署Node。

## 安装Node

### 源码安装

参考：https://www.runoob.com/nodejs/nodejs-install-setup.html

### yum 安装

```shell
yum -y install nodejs
# 查看版本，如果 node 版本太旧，可以使用 npm 第三方模块 n 模块来升级 node
node -v
# 首先全局安装 n 模块
npm i n -g
# 升级 node
n stable
```

## Node项目初始化

```shell
# 专门存放node项目的目录
mkdir -p /data/node_projects
# 创建项目
mkdir -p /data/node_projects/test
cd /data/node_projects/test
npm init -y
# 创建项目入口文件
vi app.js
# 启动项目在8081端口，需要配置防火墙，否则访问不了
node app.js
```

app.js：

```js
const http =require('http')
http.createServer(function(req,res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('hello world')
}).listen(8081)
console.log('Server running at http://自己的主机ip:8081/');
```

## CentOS 7 防火墙配置

开放端口：

```shell
# 开放8081端口
firewall-cmd --permanent --add-port=8081/tcp
# 重启防火墙(修改配置后要重启防火墙)
firewall-cmd --reload
# 开启项目
node app.js
```

在浏览器中访问：自己的主机ip:8081，即可正常访问。

##  pm2 开启项目

```shell
# 安装 pm2
npm i pm2 -g
# 使用 pm2
pm2 start app.js
```

## Nginx 反向代理

### 作用

使用Nginx绑定域名，通过域名来访问Node项目。

### 安装

```shell
# 安装之前先安装依赖项
yum -y install gcc-c++
yum -y install zlib zlib-devel openssl openssl--devel pcre pcre-devel
# 安装 Nginx
yum install nginx -y
# 查看版本
nginx -v
```

### 解除 httpd 对 80 端口的占用

因为 Nginx 要使用 80 端口，有时候 80 端口被 httpd 占用了，所以我们要删掉这个 httpd进程。

```shell
# 通过这个命令查看服务名、pid、占用的端口号
netstat -lnp
# 找到 httpd 的 pid，用 kill 删掉。
# 有时候需要多删几次才能完全删除。
kill -9 pid_number
```

### 配置

```shell
# 编辑 nginx.conf 
vi /etc/nginx/nginx.conf
```
更改 nginx.conf 文件部分：

```shell
...
server {
    listen 80;
    server_name _;
...
```

```shell
# 添加配置文件到 conf.d 目录下
vi /etc/nginx/conf.d/自己的主机域名-8081.conf
```

自己的主机域名-8081.conf 内容：

```shell
upstream roots {
  server 自己的主机ip:8081;
}

server {
  listen 80;
  server_name 自己的主机域名;
  location / {
    proxy_pass http://roots;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;    
    proxy_set_header Host $http_host; 
    proxy_set_header X-Nginx-Proxy true;
    proxy_redirect off;
  }
}
```

重启 Nginx：

```shell
nginx -s reload
```

### 报错

```shell
# 如果报类似这种错误
nginx: [error] open() "/run/nginx.pid" failed (2: No such file or directory)
```

方法一：

```shell
nginx -c /etc/nginx/nginx.conf
nginx -s reload
```

方法二：

```shell
# 修改配置文件中 pid 的位置
vi /etc/nginx/nginx.conf
```

更改 nginx.conf 文件部分：

```shell
...
pid     /run/nginx.pid
...
```

改成

```shell
...
pid     /etc/nginx/logs/nginx.pid
...
```