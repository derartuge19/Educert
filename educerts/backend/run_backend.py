import uvicorn
import sys
import traceback

if __name__ == "__main__":
    print("Starting EduCerts Backend via uvicorn.run...")
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="debug", reload=True)
    except Exception as e:
        print("!!! BACKEND CRASHED DURING STARTUP !!!")
        print(f"Error type: {type(e)}")
        print(f"Error message: {e}")
        traceback.print_exc()
        sys.exit(1)
    except BaseException as e:
        print(f"!!! BACKEND RECEIVED TERMINATION SIGNAL: {type(e)} !!!")
        traceback.print_exc()
        sys.exit(0)
