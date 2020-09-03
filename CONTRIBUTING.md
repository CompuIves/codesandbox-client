# Contributing to CodeSandbox Client

## Table of Contents

- [Кодекс поведения](#code-of-conduct)
- [Организация кода](#code-organization)
- [Настройка проекта локально](#setting-up-the-project-locally)
- [Отправка запроса pull](#submitting-a-pull-request)
- [Добавить себя в качестве вкладчика](#add-yourself-as-a-contributor)

## Кодекс поведения

У нас есть кодекс поведения, который вы можете найти [здесь](./CODE_OF_CONDUCT.md) и каждый вкладчик должен подчиняться этим правилам. 
Любые вопросы или PR, которые не соответствуют кодексу поведения, могут быть закрыты.

## Организация кода

Клиент CodeSandbox в настоящее время разделен на 5 частей. Мы используем `lerna`, чтобы
разделять зависимости между этими частями.

- `app`: Редактор, поиск, страница профиля, вложение и песочница.
- `homepage`: Сайт Гэтсби на главной странице.
- `common`: Все общие части между этими пакетами, многоразовые JS.
- `codesandbox-api`: npm-пакет, который отвечает за коммуникацию
  между песочницей и редактором.
- `codesandbox-browserfs`: Встроенная браузерная файловая система, эмулирующая API файловой системы Node JS 
и поддерживающая хранение и извлечение файлов из различных бэкэндов. 
Вставлено из [https://github.com/jvilk/BrowserFS](https://github.com/jvilk/BrowserFS), 
с дополнительным [CodeSandbox backend](https://github.com/codesandbox/codesandbox-client/blob/master/standalone-packages/codesandbox-browserfs/src/backend/CodeSandboxFS.ts).

Эта версия CodeSandbox использует в качестве источника правды свой сервер, что задается переменной окружения `LOCAL_SERVER`.  
При работе с функцией, которая требует вход в систему, вы можете войти в систему [https://codesandbox.io/](https://codesandbox.io/)  
и скопировать содержимое "Ключ к локальному хранению данных в вашей среде разработки" на [http://localhost:3000/](http://localhost:3000/).  
**Осторожнее с обработкой маркера**, так как любой, кто его знает, может войти в систему, как вы, и прочитать/записать доступ ко всему содержимому CodeSandbox!

**Работа над вашим первым запросом на вытягивание?** Вы можете узнать, как это сделать из этой _free_ серии  
[Как внести свой вклад в проект с открытым исходным кодом на GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

## Настройка проекта локально

Для установки проекта необходимо иметь `yarn` и `node`.

1.  [Fork](https://help.github.com/articles/fork-a-repo/) проект, клонируй свой fork:

    ```sh
    # Клонируй свой fork
    git clone https://github.com/<your-username>/codesandbox-client.git

    # Перейдите к новому клонированному каталогу
    cd codesandbox-client
    ```

2.  Ваша среда должна быть запущена с Node v. 10
    - `.nvmrc` конфигурация существует в repo root, указывая версию v.10.x.x
    - вы можете использовать fnm (fnm use) для изменения текущей версии узла на версию, указанную в .nvmrc
3.  с самого начала проекта: `yarn` для установки всех зависимостей
    - убедитесь, что у вас последняя версия `yarn`
4.  из корня проекта: `yarn start`
    - это создаст зависимости (`codesandbox-api` и `codesandbox-browserfs`) и запустит среду разработки `app`, 
    доступную по адресу [http://localhost:3000/s/new](http://localhost:3000/s/new) 
    - на последующих запусках вы также можете обойти построение и использование зависимостей
      `yarn start:fast`
    - если вы хотите работать на главной странице, начните с `yarn start:home`, она будет доступна на [http://localhost:8000/](http://localhost:8000/).

> Совет: Держите ветку `master`, указывающую на исходный репозиторий, и делайте запросы на вытаскивание из ветки на вилке. Чтобы сделать это, беги:
> ```sh
> git remote add upstream https://github.com/codesandbox/codesandbox-client.git
> git fetch upstream
> git branch --set-upstream-to=upstream/master master
> ```
> Это добавит оригинальный репозиторий в качестве "remote" под названием "upstream", 
> Затем извлечёт информацию о git'е с этого "remote", 
> Затем установит вашу локальную ветку `master`, чтобы использовать главную ветку "upstream" всякий раз, когда вы запускаете `git pull`. 
> Затем вы можете тянуть ветки запроса на основе этой ветки `master`. 
> Всякий раз, когда вы хотите обновить свою версию `master`, делайте регулярные `git pull`.

 
5. Если вы хотите отладить состояние приложения, установите [Cerebral Debugger](https://github.com/cerebral/cerebral-debugger/releases) и подключите его к порту "8383".            После этого, если вы обновите приложение, вы сможете увидеть состояние, выполненные последовательности и так далее. 
   См. [documentation](https://cerebraljs.com/docs/introduction/devtools.html) для справки.

## Отправка запроса pull

Please go through existing issues and pull requests to check if somebody else is
already working on it, we use `someone working on it` label to mark such issues.
Пожалуйста, просмотрите существующие проблемы и вытяните запросы, чтобы проверить, не работает ли кто-то еще над этим, мы используем ярлык `someone working on it`, чтобы отметить такие проблемы.

Кроме того, убедитесь, что вы выполнили тесты и обработали код перед фиксацией изменений.

```sh
yarn test
yarn lint
```

Перед запуском `yarn lint` вы должны построить наши пакеты `common` и `notifications`.

```sh
yarn build:deps
```

## Добавить себя в качестве вкладчика

Этот проект следует за [всеми участниками](https://github.com/all-contributors/all-contributors) спецификации. Вклады любого рода приветствуются!

Чтобы добавить себя в таблицу вкладчиков на `README.md`, пожалуйста, используйте автоматизированный скрипт как часть вашего PR:

```sh
yarn contributors:add
```

Следуйте подсказке и зафиксируйте `.all-contributorsrc` и `README.md` в PR.

Спасибо, что нашли время внести свой вклад! 👍
