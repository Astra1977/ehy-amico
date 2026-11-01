import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',workers:1,use:{baseURL:'http://127.0.0.1:8000/ehy-amico/',launchOptions:process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}},webServer:{command:'python3 -m http.server 8000 --directory ..',url:'http://127.0.0.1:8000/ehy-amico/',reuseExistingServer:true},reporter:'list'});
