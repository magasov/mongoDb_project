document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
    })
        .then(response => response.json())
        .then(data => {
            alert('Registration successful');
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
        .then(response => response.json())
        .then(data => {
            if (data) {
                alert('Login successful');
                localStorage.setItem('user', JSON.stringify(data));
                showPosts(data);
            } else {
                alert('Login failed');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});

document.getElementById('postForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const title = document.getElementById('postTitle').value;
    const description = document.getElementById('postDescription').value;
    const imageFile = document.getElementById('postImage').files[0];
    const userEmail = document.getElementById('postUser').value;

    fetch('http://localhost:3000/get-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
    })
        .then(response => response.json())
        .then(user => {
            if (user) {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                formData.append('image', imageFile);
                formData.append('userId', user._id);

                fetch('http://localhost:3000/add-post', {
                    method: 'POST',
                    body: formData,
                })
                    .then(response => response.json())
                    .then(post => {
                        alert('Post added successfully');
                        const currentUser = JSON.parse(localStorage.getItem('user'));
                        showPosts(currentUser);
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            } else {
                alert('User not found');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});

document.getElementById('logoutButton').addEventListener('click', function () {
    localStorage.removeItem('user');
    location.reload();
});

function showPosts(user) {
    document.getElementById('register').style.display = 'none';
    document.getElementById('login').style.display = 'none';
    document.getElementById('postSection').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'block';

    if (user.email === 'moderator@example.com') {
        document.getElementById('addPost').style.display = 'block';
    }

    fetch(`http://localhost:3000/posts/${user._id}`)
        .then(response => response.json())
        .then(posts => {
            const postsContainer = document.getElementById('posts');
            postsContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.description}</p>
                <img src="${post.imageUrl}" alt="${post.title}">
                ${user.email === 'moderator@example.com' ? `<button onclick="deletePost('${post._id}')">Delete</button>` : ''}
            `;
                postsContainer.appendChild(postElement);
            });
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function deletePost(postId) {
    fetch(`http://localhost:3000/delete-post/${postId}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(() => {
            alert('Post deleted successfully');
            const user = JSON.parse(localStorage.getItem('user'));
            showPosts(user);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        showPosts(user);
    }
});
