class ClientFunctionManager {
    constructor() {
        // Хранилище загруженных функций
        this.loadedFunctions = new Map();
        // Хранилище интервалов для функций
        this.functionIntervals = new Map();
        // Базовый путь для файлов функций
        this.basePath = './functions';
        // Флаг логирования
        this.debug = true;
        // Настройки для кнопки закрытия
        this.closeButtonConfig = {
            size: 40,           // размер в пикселях
            opacity: 0.7,       // начальная прозрачность
            hoverOpacity: 0.9,  // прозрачность при наведении
            animationDuration: 300, // длительность анимации в мс
            inactivityTimeout: 100000, // время в мс до появления кнопки при неактивности
            mouseProximity: 100  // расстояние в пикселях, при котором кнопка появляется
        };

        // Состояние мыши
        this.mouseState = {
            x: 0,
            y: 0,
            lastMoved: Date.now()
        };

        // Привязка обработчиков событий мыши
        this._bindMouseEvents();
    }

    /**
     * Привязка обработчиков событий мыши для отслеживания движения
     */
    _bindMouseEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouseState.x = e.clientX;
            this.mouseState.y = e.clientY;
            this.mouseState.lastMoved = Date.now();

            // Проверяем, нужно ли показать кнопку закрытия
            this._checkCloseButtonVisibility();
        });
    }

    /**
     * Проверка необходимости отображения кнопки закрытия
     */
    _checkCloseButtonVisibility() {
        // Если нет активных функций, не показываем кнопку
        if (this.loadedFunctions.size === 0) return;

        const closeButton = document.getElementById('function-close-button');
        if (!closeButton) return;

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Расчет расстояния от указателя мыши до центра экрана
        const distanceToCenter = Math.sqrt(
            Math.pow(this.mouseState.x - centerX, 2) +
            Math.pow(this.mouseState.y - centerY, 2)
        );

        // Определяем, нужно ли показать кнопку
        const shouldShow = distanceToCenter <= this.closeButtonConfig.mouseProximity ||
            (Date.now() - this.mouseState.lastMoved) >= this.closeButtonConfig.inactivityTimeout;

        // Плавно изменяем прозрачность кнопки
        if (shouldShow) {
            closeButton.style.opacity = this.closeButtonConfig.opacity;
            closeButton.style.transform = 'scale(1)';
        } else {
            closeButton.style.opacity = '0';
            closeButton.style.transform = 'scale(0.8)';
        }
    }

    /**
     * Создание кнопки закрытия функции
     */
    _createCloseButton() {
        // Удаляем существующую кнопку, если она есть
        const existingButton = document.getElementById('function-close-button');
        if (existingButton) {
            document.body.removeChild(existingButton);
        }

        // Создаем новую кнопку
        const closeButton = document.createElement('div');
        closeButton.id = 'function-close-button';

        // Стилизация кнопки
        Object.assign(closeButton.style, {
            position: 'fixed',
            zIndex: '999999',
            width: `${this.closeButtonConfig.size}px`,
            height: `${this.closeButtonConfig.size}px`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) scale(0.8)',
            opacity: '0',
            transition: `opacity ${this.closeButtonConfig.animationDuration}ms ease, transform ${this.closeButtonConfig.animationDuration}ms ease`,
            cursor: 'pointer',
            background: 'rgba(30, 30, 30, 0.7)',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            userSelect: 'none'
        });

        // Добавляем SVG иконку "нейронного шара"
        closeButton.innerHTML = `
            <svg width="${this.closeButtonConfig.size * 0.6}" height="${this.closeButtonConfig.size * 0.6}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.5" stroke-opacity="0.8"/>
                <path d="M12 6 L12 18" stroke="white" stroke-width="1.5" stroke-opacity="0.8" transform="rotate(45 12 12)"/>
                <path d="M12 6 L12 18" stroke="white" stroke-width="1.5" stroke-opacity="0.8" transform="rotate(-45 12 12)"/>
                <circle cx="8" cy="8" r="1" fill="white" fill-opacity="0.8"/>
                <circle cx="16" cy="8" r="1" fill="white" fill-opacity="0.8"/>
                <circle cx="16" cy="16" r="1" fill="white" fill-opacity="0.8"/>
                <circle cx="8" cy="16" r="1" fill="white" fill-opacity="0.8"/>
            </svg>
        `;

        // Добавляем эффекты при наведении
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.opacity = this.closeButtonConfig.hoverOpacity;
            closeButton.style.transform = 'scale(1.1)';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.opacity = this.closeButtonConfig.opacity;
            closeButton.style.transform = 'scale(1)';
        });

        // Добавляем обработчик клика для закрытия всех функций
        closeButton.addEventListener('click', () => {
            this.stopAllFunctions();
        });

        // Добавляем кнопку на страницу
        document.body.appendChild(closeButton);

        // Запускаем анимацию появления с небольшой задержкой
        setTimeout(() => {
            this._checkCloseButtonVisibility();
        }, 10);

        // Запускаем интервал для проверки неактивности
        setInterval(() => {
            this._checkCloseButtonVisibility();
        }, 1000);
    }

    /**
     * Логирование сообщений, если включен режим отладки
     * @param {string} message - Сообщение для логирования
     * @param {any} data - Дополнительные данные для логирования
     */
    log(message, data = null) {
        if (this.debug) {
            if (data) {
                console.log(`[ClientFunctionManager] ${message}`, data);
            } else {
                console.log(`[ClientFunctionManager] ${message}`);
            }
        }
    }

    /**
     * Обработка входящего сообщения от сервера
     * @param {Object} message - Сообщение от сервера
     * @returns {Promise<Object>} - Результат обработки сообщения
     */
    async handleMessage(message) {
        try {
            // Проверка формата сообщения
            if (!message || !message.type || !message.function) {
                throw new Error('Неверный формат сообщения');
            }

            const { type, function: functionName, args = {} } = message;

            // Проверка допустимости имени функции
            if (!this.isValidFunctionName(functionName)) {
                throw new Error(`Недопустимое имя функции: ${functionName}`);
            }

            this.log(`Получено сообщение типа: ${type} для функции: ${functionName}`, args);

            // Выбор действия в зависимости от типа сообщения
            switch (type.toUpperCase()) {
                case 'START':
                    return await this.startFunction(functionName, args);
                case 'SET':
                    return await this.setFunctionParams(functionName, args);
                case 'GET':
                    return await this.getFunctionData(functionName, args);
                case 'STOP':
                    return await this.stopFunction(functionName);
                default:
                    throw new Error(`Неизвестный тип сообщения: ${type}`);
            }
        } catch (error) {
            this.log(`Ошибка при обработке сообщения: ${error.message}`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Проверка допустимости имени функции
     * @param {string} name - Имя функции для проверки
     * @returns {boolean} - Результат проверки
     */
    isValidFunctionName(name) {
        // Базовая проверка на допустимые символы в имени файла/функции
        return /^[a-zA-Z0-9_-]+$/.test(name);
    }

    /**
     * Загрузка функции из файла
     * @param {string} functionName - Имя функции для загрузки
     * @returns {Promise<Object>} - Объект с функциями из загруженного модуля
     */
    async loadFunction(functionName) {
        try {
            await this.stopAllFunctions();

            // Путь к файлу функции
            const functionPath = `${this.basePath}/${functionName}/index.html`;

            this.log(`Загрузка функции ${functionName} из ${functionPath}`);

            // Создаём iframe для изоляции функции
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none'; // Скрываем iframe
            iframe.id = `function-frame-${functionName}`;
            iframe.classList.add('function-frame');
            setAIState('displaying')
            document.body.appendChild(iframe);

            // Загружаем содержимое HTML-файла
            const response = await fetch(functionPath);

            if (!response.ok) {
                throw new Error(`Ошибка загрузки функции: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();

            // Записываем HTML в iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(html);
            iframeDoc.close();

            await new Promise(resolve => {
                const doc = iframe.contentDocument || iframe.contentWindow.document;

                if (doc.readyState === 'complete' || doc.readyState === 'interactive') {
                    // уже загружено
                    resolve();
                } else {
                    doc.addEventListener('DOMContentLoaded', () => {
                        resolve();
                    });
                }
            });

            // Получаем ссылки на обязательные функции
            const functionObj = {
                iframe,
                window: iframe.contentWindow,
                START: iframe.contentWindow.START,
                SET: iframe.contentWindow.SET,
                GET: iframe.contentWindow.GET,
                STOP: iframe.contentWindow.STOP
            };

            // Проверяем наличие всех необходимых функций
            ['START', 'SET', 'GET', 'STOP'].forEach(method => {
                if (typeof functionObj[method] !== 'function') {
                    throw new Error(`Функция ${method} не найдена в модуле ${functionName}`);
                }
            });

            // Сохраняем функцию в кэше
            this.loadedFunctions.set(functionName, functionObj);

            this.log(`Функция ${functionName} успешно загружена`);

            return functionObj;
        } catch (error) {
            this.log(`Ошибка при загрузке функции ${functionName}: ${error.message}`, error);
            // Удаляем iframe в случае ошибки
            const iframe = document.getElementById(`function-frame-${functionName}`);
            if (iframe) {
                document.body.removeChild(iframe);
            }
            throw error;
        }
    }

    /**
     * Запуск функции
     * @param {string} functionName - Имя функции для запуска
     * @param {Object} args - Аргументы для функции
     * @returns {Promise<Object>} - Результат выполнения функции
     */
    async startFunction(functionName, args) {
        console.log('start function')
        try {
            const functionObj = await this.loadFunction(functionName);

            // Делаем iframe видимым для запущенной функции
            functionObj.iframe.style.display = 'block';

            // Создаем кнопку закрытия функции
            this._createCloseButton();

            // Вызываем функцию START
            const result = await functionObj.START(args);

            this.log(`Функция ${functionName} запущена`, result);

            return {
                success: true,
                data: result || { message: `Функция ${functionName} успешно запущена` }
            };
        } catch (error) {
            this.log(`Ошибка при запуске функции ${functionName}: ${error.message}`, error);
            return {
                success: false,
                error: `Ошибка при запуске функции ${functionName}: ${error.message}`
            };
        }
    }

    /**
     * Обновление параметров функции
     * @param {string} functionName - Имя функции для обновления
     * @param {Object} args - Новые параметры
     * @returns {Promise<Object>} - Результат обновления параметров
     */
    async setFunctionParams(functionName, args) {
        try {
            // Проверка, что функция загружена
            if (!this.loadedFunctions.has(functionName)) {
                throw new Error(`Функция ${functionName} не загружена, сначала вызовите START`);
            }

            const functionObj = this.loadedFunctions.get(functionName);

            // Вызываем функцию SET
            const result = await functionObj.SET(args);

            this.log(`Параметры функции ${functionName} обновлены`, result);

            return {
                success: true,
                data: result || { message: `Параметры функции ${functionName} успешно обновлены` }
            };
        } catch (error) {
            this.log(`Ошибка при обновлении параметров функции ${functionName}: ${error.message}`, error);
            return {
                success: false,
                error: `Ошибка при обновлении параметров функции ${functionName}: ${error.message}`
            };
        }
    }

    /**
     * Получение данных от функции
     * @param {string} functionName - Имя функции для получения данных
     * @param {Object} args - Аргументы для запроса данных
     * @returns {Promise<Object>} - Результат получения данных
     */
    async getFunctionData(functionName, args) {
        try {
            // Проверка, что функция загружена
            if (!this.loadedFunctions.has(functionName)) {
                throw new Error(`Функция ${functionName} не загружена, сначала вызовите START`);
            }

            const functionObj = this.loadedFunctions.get(functionName);

            // Вызываем функцию GET
            const result = await functionObj.GET(args);

            this.log(`Получены данные от функции ${functionName}`, result);

            return {
                success: true,
                data: result
            };
        } catch (error) {
            this.log(`Ошибка при получении данных от функции ${functionName}: ${error.message}`, error);
            return {
                success: false,
                error: `Ошибка при получении данных от функции ${functionName}: ${error.message}`
            };
        }
    }

    /**
     * Остановка функции
     * @param {string} functionName - Имя функции для остановки
     * @returns {Promise<Object>} - Результат остановки функции
     */
    async stopFunction(functionName) {
        try {
            // Проверка, что функция загружена
            if (!this.loadedFunctions.has(functionName)) {
                return {
                    success: true,
                    message: `Функция ${functionName} уже остановлена или не была запущена`
                };
            }

            const functionObj = this.loadedFunctions.get(functionName);

            // Анимация закрытия (плавное исчезновение iframe)
            functionObj.iframe.style.transition = 'opacity 300ms ease';
            functionObj.iframe.style.opacity = '0';

            // Даем время на анимацию
            await new Promise(resolve => setTimeout(resolve, 300));

            // Вызываем функцию STOP
            await functionObj.STOP();

            // Удаляем iframe
            document.body.removeChild(functionObj.iframe);

            // Удаляем функцию из кэша
            this.loadedFunctions.delete(functionName);

            // Очищаем интервалы, если они есть
            if (this.functionIntervals.has(functionName)) {
                clearInterval(this.functionIntervals.get(functionName));
                this.functionIntervals.delete(functionName);
            }

            // Удаляем кнопку закрытия, если больше нет активных функций
            if (this.loadedFunctions.size === 0) {
                const closeButton = document.getElementById('function-close-button');
                if (closeButton) {
                    // Анимация исчезновения кнопки
                    closeButton.style.opacity = '0';
                    closeButton.style.transform = 'translate(-50%, -50%) scale(0)';

                    // Удаляем элемент после анимации
                    setTimeout(() => {
                        if (closeButton.parentNode) {
                            document.body.removeChild(closeButton);
                        }
                    }, this.closeButtonConfig.animationDuration);
                }
            }

            this.log(`Функция ${functionName} остановлена`);

            return {
                success: true,
                message: `Функция ${functionName} успешно остановлена`
            };
        } catch (error) {
            this.log(`Ошибка при остановке функции ${functionName}: ${error.message}`, error);

            // В любом случае удаляем функцию из кэша и пытаемся удалить iframe
            this.loadedFunctions.delete(functionName);

            const iframe = document.getElementById(`function-frame-${functionName}`);
            if (iframe) {
                document.body.removeChild(iframe);
            }

            // Удаляем кнопку закрытия, если больше нет активных функций
            if (this.loadedFunctions.size === 0) {
                const closeButton = document.getElementById('function-close-button');
                if (closeButton) {
                    document.body.removeChild(closeButton);
                }
            }

            return {
                success: false,
                error: `Ошибка при остановке функции ${functionName}: ${error.message}`
            };
        }
    }

    /**
     * Остановка всех запущенных функций
     * @returns {Promise<Object>} - Результат остановки всех функций
     */
    async stopAllFunctions() {
        try {
            const functionNames = [...this.loadedFunctions.keys()];

            // Анимация исчезновения кнопки закрытия
            const closeButton = document.getElementById('function-close-button');
            if (closeButton) {
                closeButton.style.opacity = '0';
                closeButton.style.transform = 'translate(-50%, -50%) scale(0)';

                // Удаляем элемент после анимации
                setTimeout(() => {
                    if (closeButton && closeButton.parentNode) {
                        document.body.removeChild(closeButton);
                    }
                }, this.closeButtonConfig.animationDuration);
            }

            for (const functionName of functionNames) {
                await this.stopFunction(functionName);
            }

            this.log('Все функции остановлены');
            setAIState('idle');

            return {
                success: true,
                message: 'Все функции успешно остановлены'
            };
        } catch (error) {
            this.log(`Ошибка при остановке всех функций: ${error.message}`, error);

            // Удаляем кнопку закрытия в любом случае
            const closeButton = document.getElementById('function-close-button');
            if (closeButton) {
                document.body.removeChild(closeButton);
            }

            return {
                success: false,
                error: `Ошибка при остановке всех функций: ${error.message}`
            };
        }
    }
}

// Создаем глобальный экземпляр менеджера
window.clientFunctionManager = new ClientFunctionManager();
