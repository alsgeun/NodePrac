import express from "express";
import Todo from "../schemas/todo.schemas.js"; //Todo 라는 모델을 가져옴
import Joi from "joi";

const router = express.Router(); //router 생성

// 1. `value` 데이터는 **필수적으로 존재**해야한다.
// 2. `value` 데이터는 **문자열 타입**이어야한다.
// 3. `value` 데이터는 **최소 1글자 이상**이어야한다.
// 4. `value` 데이터는 **최대 50글자 이하**여야한다.
// 5. 유효성 검사에 실패했을 때, 에러가 발생해야한다.

const createdTodoSchema = Joi.object({
  value: Joi.string().min(1).max(50).required(),
});

// 할일 등록 api
router.post("/todos", async (req, res, next) => {
  try {
    // 1. 클라이언트로 부터 받아온 value 데이터를 조회
    // const {value} = req.body;

    const validation = await createdTodoSchema.validateAsync(req.body);

    const { value } = validation;

    // 1-5. 만약, 클라이언트가 value 데이터를 전달하지 않았을 때, 클라이언트에게 에러 메시지를 전달한다.
    if (!value) {
      return res
        .status(400)
        .json({ errorMessage: "해야할 일(value) 데이터가 존재하지 않습니다." });
    }

    // 2. 해당하는 마지막 order 데이터를 조회한다.
    // findOne 은 1개의 데이터만 조회한다.
    // sort = 정렬한다. -> 어떤 컬럼을? order / -order : 내림차순, - 제거하면 오름차순
    const todoMaxOder = await Todo.findOne().sort("-order").exec(); //.exec() 를 붙이지 않으면 Todo부터 order 까지 모든게 promis로 동작하지 않음
    // await 도 사용 불가능 하게 됨, 몽구스에다 데이터를 보냈지만 실제 데이터가 언제 받아 오는지 확실해지지 않는다.
    // 3. 만약 존재한다면 현재 해야 할 일을 +1 하고, order 데이터가 존재하지 않다면, 1로 할당한다.
    const order = todoMaxOder ? todoMaxOder.order + 1 : 1; //삼항 연산자 사용한듯?
    // todoMaxOder 가 존재한다면 todoMaxOder에 order 값에 +1 해서 현재 해야 할 일에 할당

    // 4. 해야할 일 등록
    const todo = new Todo({ value, order }); // todo 라는 새 변수에 받아온 값 할당(value, order)
    await todo.save(); // 이래야 DB에 저장됨

    // 5. 해야할 일을 클라이언트에게 반환한다.
    return res.status(201).json({ todo: todo });
  } catch (error) {
    next(error);
  }
});

// 해야할 일 목록 조회 api
router.get("/todos", async (req, res, next) => {
  // 1. 해야할 일 목록 조회 진행
  const todos = await Todo.find().sort("-older").exec();

  // 2. 해야할 일 목록 조회 결과를 클라이언트에게 전달
  return res.status(200).json({ todos });
});

// 해야할 일 순서 변경, 완료 / 해제, 내용 변경 API
router.patch("/todos/:todoId", async (req, res, next) => {
  const { todoId } = req.params; //:todoId 에서 가져왔기 때문에 params
  const { order, done, value } = req.body;

  // 현재 나의 order가 무엇인지 알아야한다.
  const currentTodo = await Todo.findById(todoId).exec(); //findById() todoId에 해당하는 특정한 일을 가지고 올 것이다.
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 해야할 일 입니다." });
  }

  if (order) {
    const targetTodo = await Todo.findOne({ order: order }).exec();
    if (targetTodo) {
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }
    currentTodo.order = order;
  }
  if (done !== undefined) {
    currentTodo.doneAt = done ? new Date() : null;
  }

  if (value) {
    currentTodo.value = value;
  }

  await currentTodo.save();

  return res.status(200).json({});
});
//해야할 일 삭제 api
router.delete("/todos/:todoId", async (req, res, next) => {
  const { todoId } = req.params;

  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 해야할 일 정보 입니다." });
  }
  await Todo.deleteOne({ _id: todoId });

  return res.status(200).json({});
});

export default router; // router 내보내기
