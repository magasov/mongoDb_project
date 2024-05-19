const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

const User = require('./models/user');
const Post = require('./models/post');

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect('mongodb+srv://magasov:12345@magasov.pnjqkm6.mongodb.net/?retryWrites=true&w=majority&appName=magasov', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Добавление уникального имени файла
    }
});
const upload = multer({ storage: storage });

// Routes
app.post('/register', (req, res) => {
    const newUser = new User(req.body);
    newUser.save((err, user) => {
        if (err) return res.status(500).send(err);
        return res.status(200).send(user);
    });
});

app.post('/login', (req, res) => {
    User.findOne({ email: req.body.email, password: req.body.password }, (err, user) => {
        if (err) return res.status(500).send(err);
        if (!user) return res.status(404).send(JSON.stringify('User not found'));
        return res.status(200).send(user);
    });
});

app.post('/get-user', (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) return res.status(500).send(err);
        if (!user) return res.status(404).send(JSON.stringify('User not found'));
        return res.status(200).send(user);
    });
});

app.post('/add-post', upload.single('image'), (req, res) => {
    const { title, description, userId } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const newPost = new Post({ title, description, imageUrl, user: userId });

    newPost.save((err, post) => {
        if (err) return res.status(500).send(err);

        User.findByIdAndUpdate(
            userId,
            { $push: { posts: post._id } },
            { new: true, useFindAndModify: false },
            (err, user) => {
                if (err) return res.status(500).send(err);
                return res.status(200).send(post);
            }
        );
    });
});

app.delete('/delete-post/:id', (req, res) => {
    const postId = req.params.id;
    Post.findByIdAndDelete(postId, (err, post) => {
        if (err) return res.status(500).send(err);
        User.findByIdAndUpdate(
            post.user,
            { $pull: { posts: postId } },
            { new: true, useFindAndModify: false },
            (err, user) => {
                if (err) return res.status(500).send(err);
                return res.status(200).send('Post deleted');
            }
        );
    });
});

app.get('/posts/:userId', (req, res) => {
    const userId = req.params.userId;
    User.findById(userId)
        .populate('posts')
        .exec((err, user) => {
            if (err) return res.status(500).send(err);
            return res.status(200).send(user.posts);
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
