const enter = document.querySelector('#enter');
const inputNickname = document.querySelector('#inputNickname');
//zatwierdzenie nicku
addEventListener('keydown', function (e) {
    if (e.key == "Enter") {
        post();
    }
});
enter.addEventListener('click', function () {
    post();
});

function post() {
    fetch('/enter', {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({nickname: inputNickname.value})
    }).then(function (data) {
        location.replace("/queue");
    });
}